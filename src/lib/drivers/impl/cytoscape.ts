import type cytoscape from 'cytoscape'
import {
  type Core,
  type CytoscapeOptions as _Options,
  type ElementDefinition,
} from 'cytoscape'
import {
  type ContextFlags,
  DriverImpl,
  ErrorUnsupported,
  type MountFlags,
  type Size,
  defaultLayout,
} from '.'
import {
  type BundleOptions,
  type BundleEdge,
  type BundleNode,
} from '../../graph/builders/bundle'
import { LazyValue } from '../../utils/once'
import {
  type ModelOptions,
  type ModelEdge,
  type ModelNode,
  LiteralModelNode,
  ConceptModelNode,
  type Element,
} from '../../graph/builders/model/types'

const Cytoscape = new LazyValue(async () => {
  const cytoscape = (await import('cytoscape')).default

  // load all the extensions
  await Promise.all(
    [
      import('cytoscape-cola'),
      import('cytoscape-dagre'),
      import('cytoscape-fcose'),
      import('cytoscape-avsdf'),
    ].map(async imp => {
      await imp.then(ext => {
        cytoscape.use(ext.default)
      })
    }),
  )

  return cytoscape
})

type Elements = ElementDefinition[]
type CytoscapeCore = Core
type CytoscapeOptions = Omit<_Options, 'container' | 'elements'>

abstract class CytoscapeDriver<
  NodeLabel,
  EdgeLabel,
  Options,
> extends DriverImpl<NodeLabel, EdgeLabel, Options, Elements, CytoscapeCore> {
  protected abstract addNodeImpl(
    elements: Elements,
    flags: ContextFlags<Options>,
    id: string,
    node: NodeLabel,
  ): Promise<undefined>
  protected abstract addEdgeImpl(
    elements: Elements,
    flags: ContextFlags<Options>,
    id: string,
    from: string,
    to: string,
    edge: EdgeLabel,
  ): Promise<undefined>

  readonly driverName = 'Cytoscape'
  readonly supportedLayouts = [
    defaultLayout,
    'grid',
    'circle',
    'concentric',
    'avsdf',
    'dagre',
    'breadthfirst',
    'fcose',
    'cola',
  ]
  protected layoutOptions(
    layout: string,
    definitelyAcyclic: boolean,
  ): CytoscapeOptions['layout'] {
    const maxSimulationTime = 365 * 24 * 60 * 60 * 1000 // 1 year
    switch (
      layout === defaultLayout ? (definitelyAcyclic ? 'dagre' : 'cola') : layout
    ) {
      case 'grid':
        return { name: 'grid' }
      case 'circle':
        return { name: 'circle' }
      case 'concentric':
        return { name: 'concentric' }
      case 'avsdf':
        return { name: 'avsdf' }
      case 'cola':
        return { name: 'cola', maxSimulationTime } as unknown as any
      case 'elk':
        return { name: 'elk', maxSimulationTime } as unknown as any
      case 'fcose':
        return { name: 'fcose', maxSimulationTime } as unknown as any
      case 'breadthfirst':
        return { name: 'breadthfirst' }
      case 'dagre': /* fallthrough */
      default:
        return { name: 'dagre', padding: 100 } as unknown as any
    }
  }

  protected options(
    layout: string,
    definitelyAcyclic: boolean,
  ): CytoscapeOptions {
    return {
      style: [
        {
          selector: 'node',
          style: {
            'label': 'data(label)',
            'text-wrap': 'wrap',
            'color': 'data(color)',
          },
        },
        {
          selector: 'node:selected',
          style: {
            'text-background-opacity': 1,
            'text-background-color': '#fff',
            'text-background-shape': 'roundrectangle',
            'text-background-padding': '5px',
            'text-border-color': '#888',
            'text-border-width': 1,
            'text-border-opacity': 1,
            'background-color': 'data(color)',
          },
        },
        {
          selector: 'edge',
          style: {
            'width': 3,
            'line-color': 'data(color)',
            'target-arrow-color': 'data(color)',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
          },
        },
        {
          selector: 'edge[label]',
          style: {
            label: 'data(label)',
          },
        },
        {
          selector: 'edge[label]:selected',
          style: {
            'text-background-opacity': 1,
            'text-background-color': '#fff',
            'text-background-shape': 'roundrectangle',
            'text-background-padding': '5px',
            'text-border-color': '#888',
            'text-border-width': 1,
            'text-border-opacity': 1,
          },
        },
      ],
      layout: this.layoutOptions(layout, definitelyAcyclic),
    }
  }

  protected async newContextImpl(): Promise<Elements> {
    return []
  }

  protected async finalizeContextImpl(elements: Elements): Promise<Elements> {
    await Cytoscape.load()
    return elements
  }

  protected mountImpl(
    elements: Elements,
    { container, layout, definitelyAcyclic }: MountFlags<Options>,
  ): CytoscapeCore {
    const options = this.options(layout, definitelyAcyclic)
    return Cytoscape.value({
      container,
      elements,
      ...options,
    })
  }

  protected resizeMountImpl(
    c: CytoscapeCore,
    elements: Elements,
    flags: MountFlags<Options>,
    { width, height }: Size,
  ): undefined {
    // automatically resized ?
    c.resize()
  }

  protected unmountImpl(c: CytoscapeCore, elements: unknown): void {
    c.destroy()
  }

  readonly supportedExportFormats = []
  protected async exportImpl(
    elements: Elements,
    flags: ContextFlags<Options>,
    format: string,
    mount?: { mount: CytoscapeCore; flags: MountFlags<Options> },
  ): Promise<Blob> {
    throw ErrorUnsupported
  }
}

export class CytoBundleDriver extends CytoscapeDriver<
  BundleNode,
  BundleEdge,
  BundleOptions
> {
  protected async addNodeImpl(
    elements: Elements,
    { options: { cm } }: ContextFlags<BundleOptions>,
    id: string,
    node: BundleNode,
  ): Promise<undefined> {
    if (node.type === 'bundle') {
      const label = 'Bundle\n' + node.bundle.path.name
      const data = { id, label, color: cm.getDefault(node.bundle) }
      elements.push({ data })
      return
    }
    if (node.type === 'field') {
      const label = node.field.path.name
      const data = { id, label, color: cm.getDefault(node.field) }
      elements.push({ data })
      return
    }
    throw new Error('never reached')
  }

  protected async addEdgeImpl(
    elements: Elements,
    flags: ContextFlags<BundleOptions>,
    id: string,
    from: string,
    to: string,
    edge: BundleEdge,
  ): Promise<undefined> {
    if (edge.type === 'child_bundle') {
      const data = { id, source: from, target: to, color: 'black' }
      elements.push({ data })
      return
    }
    if (edge.type === 'field') {
      const data = { id, source: from, target: to, color: 'black' }
      elements.push({ data })
      return
    }
    throw new Error('never reached')
  }
}

export class CytoModelDriver extends CytoscapeDriver<
  ModelNode,
  ModelEdge,
  ModelOptions
> {
  protected async addNodeImpl(
    elements: Elements,
    { options }: ContextFlags<ModelOptions>,
    id: string,
    node: ModelNode,
  ): Promise<undefined> {
    if (node instanceof LiteralModelNode) {
      this.#addLiteralNode(elements, options, id, node)
      return
    }
    if (node instanceof ConceptModelNode) {
      this.#addConceptNode(elements, options, id, node)
      return
    }
    throw new Error('never reached')
  }

  #addLiteralNode(
    elements: Elements,
    options: ModelOptions,
    id: string,
    node: LiteralModelNode,
  ): void {
    const element = node.render(id, options)

    elements.push({
      data: {
        id: element.id,
        ...CytoModelDriver.#nodeData(element),
      },
    })

    if (typeof element.attached === 'undefined') {
      return
    }

    element.attached.fields.forEach(({ node, edge }) => {
      elements.push({
        data: {
          id: node.id,
          ...CytoModelDriver.#nodeData(node),
        },
      })

      elements.push({
        data: {
          id: edge.id,
          source: element.id,
          target: node.id,
          ...CytoModelDriver.#edgeData(edge),
        },
      })
    })
  }

  #addConceptNode(
    elements: Elements,
    options: ModelOptions,
    id: string,
    node: ConceptModelNode,
  ): void {
    const element = node.render(id, options)

    elements.push({
      data: {
        id: element.id,
        ...CytoModelDriver.#nodeData(element),
      },
    })

    if (typeof element.attached === 'undefined') {
      return
    }

    element.attached.fields.forEach(({ node, edge }) => {
      elements.push({
        data: {
          id: node.id,
          ...CytoModelDriver.#nodeData(node),
        },
      })

      elements.push({
        data: {
          id: edge.id,
          source: element.id,
          target: node.id,
          ...CytoModelDriver.#edgeData(edge),
        },
      })
    })

    element.attached.bundles.forEach(({ node, edge }) => {
      elements.push({
        data: {
          id: node.id,
          ...CytoModelDriver.#nodeData(node),
        },
      })

      elements.push({
        data: {
          id: edge.id,
          source: element.id,
          target: node.id,
          ...CytoModelDriver.#edgeData(edge),
        },
      })
    })
  }

  protected async addEdgeImpl(
    elements: Elements,
    { options }: ContextFlags<ModelOptions>,
    id: string,
    from: string,
    to: string,
    edge: ModelEdge,
  ): Promise<undefined> {
    const element = edge.render(id, options)
    const data = {
      id: element.id,
      source: from,
      target: to,
      ...CytoModelDriver.#edgeData(element),
    }
    elements.push({ data })
  }

  static readonly #defaultEdgeColor = 'black'
  static readonly #defaultNodeColor = 'black'

  static #nodeData(element: Element): Omit<cytoscape.NodeDataDefinition, 'id'> {
    return {
      label: element.label ?? '',
      color: element.color ?? CytoModelDriver.#defaultNodeColor,
    }
  }

  static #edgeData(
    element: Element,
  ): Omit<cytoscape.EdgeDataDefinition, 'id' | 'source' | 'target'> {
    return {
      label: element.label ?? '',
      color: element.color ?? CytoModelDriver.#defaultEdgeColor,
    }
  }
}

// spellchecker:words avsdf breadthfirst roundrectangle fcose dagre
