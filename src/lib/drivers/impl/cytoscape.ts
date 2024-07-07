import { type ElementDefinition, type Core, type CytoscapeOptions } from 'cytoscape'
import { type ContextFlags, defaultLayout, DriverImpl, ErrorUnsupported, type MountFlags, type Size } from '.'
import { type BundleEdge, type BundleNode } from '../../graph/builders/bundle'
import { type ModelEdge, type ModelNode, modelNodeLabel } from '../../graph/builders/model'
import { LazyValue } from '../../utils/once'

const Cytoscape = new LazyValue(async () => {
  const cytoscape = (await import('cytoscape')).default

  // load all the extensions
  await Promise.all(
    [
      import('cytoscape-cola'),
      import('cytoscape-dagre'),
      import('cytoscape-fcose'),
      import('cytoscape-avsdf')
    ]
      .map(
        async imp => { await imp.then(ext => { cytoscape.use(ext.default) }) }
      )
  )

  return cytoscape
})

type Elements = ElementDefinition[]
type CytoscapeCore = Core
type Options = Omit<CytoscapeOptions, 'container' | 'elements'>

abstract class CytoscapeDriver<NodeLabel, EdgeLabel> extends DriverImpl<NodeLabel, EdgeLabel, Elements, CytoscapeCore > {
  protected abstract addNodeImpl (elements: Elements, flags: ContextFlags, id: string, node: NodeLabel): Promise<undefined>
  protected abstract addEdgeImpl (elements: Elements, flags: ContextFlags, id: string, from: string, to: string, edge: EdgeLabel): Promise<undefined>

  readonly driverName = 'Cytoscape'
  readonly supportedLayouts = [defaultLayout, 'grid', 'circle', 'concentric', 'avsdf', 'dagre', 'breadthfirst', 'fcose', 'cola']

  protected layoutOptions (layout: string, definitelyAcyclic: boolean): Options['layout'] {
    const maxSimulationTime = 365 * 24 * 60 * 60 * 1000 // 1 year
    switch (layout === defaultLayout ? (definitelyAcyclic ? 'dagre' : 'cola') : layout) {
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

  protected options (layout: string, definitelyAcyclic: boolean): Options {
    return {
      style: [
        {
          selector: 'node',
          style: {
            label: 'data(label)',
            'text-wrap': 'wrap',
            color: 'data(color)'

          }
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
            'background-color': 'data(color)'
          }
        },
        {
          selector: 'edge',
          style: {
            width: 3,
            'line-color': 'data(color)',
            'target-arrow-color': 'data(color)',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier'
          }
        }, {
          selector: 'edge[label]',
          style: {
            label: 'data(label)'
          }
        }, {
          selector: 'edge[label]:selected',
          style: {
            'text-background-opacity': 1,
            'text-background-color': '#fff',
            'text-background-shape': 'roundrectangle',
            'text-background-padding': '5px',
            'text-border-color': '#888',
            'text-border-width': 1,
            'text-border-opacity': 1
          }
        }
      ],
      layout: this.layoutOptions(layout, definitelyAcyclic)
    }
  }

  protected async newContextImpl (): Promise<Elements> {
    return []
  }

  protected async finalizeContextImpl (elements: Elements): Promise<Elements> {
    await Cytoscape.load()
    return elements
  }

  protected mountImpl (elements: Elements, { container, layout, definitelyAcyclic }: MountFlags): CytoscapeCore {
    const options = this.options(layout, definitelyAcyclic)
    return Cytoscape.value({
      container,
      elements,
      ...options
    })
  }

  protected resizeMountImpl (c: CytoscapeCore, elements: Elements, flags: MountFlags, { width, height }: Size): undefined {
    // automatically resized ?
    c.resize()
  }

  protected unmountImpl (c: CytoscapeCore, elements: unknown): void {
    c.destroy()
  }

  readonly supportedExportFormats = []
  protected async exportImpl (elements: Elements, flags: ContextFlags, format: string, mount?: { mount: CytoscapeCore, flags: MountFlags }): Promise<Blob> {
    throw ErrorUnsupported
  }
}

export class CytoBundleDriver extends CytoscapeDriver<BundleNode, BundleEdge> {
  protected async addNodeImpl (elements: Elements, { cm }: ContextFlags, id: string, node: BundleNode): Promise<undefined> {
    if (node.type === 'bundle') {
      const label = 'Bundle\n' + node.bundle.path.name
      const data = { id, label, color: cm.get(node.bundle) }
      elements.push({ data })
      return
    }
    if (node.type === 'field') {
      const label = node.field.path.name
      const data = { id, label, color: cm.get(node.field) }
      elements.push({ data })
      return
    }
    throw new Error('never reached')
  }

  protected async addEdgeImpl (elements: Elements, flags: ContextFlags, id: string, from: string, to: string, edge: BundleEdge): Promise<undefined> {
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

export class CytoModelDriver extends CytoscapeDriver<ModelNode, ModelEdge> {
  private static _instance: CytoModelDriver | null = null
  static get instance (): CytoModelDriver {
    if (this._instance === null) {
      this._instance = new this()
    }
    return this._instance
  }

  protected async addNodeImpl (elements: Elements, { ns, cm }: ContextFlags, id: string, node: ModelNode): Promise<undefined> {
    const label = modelNodeLabel(node, ns)
    if (node.type === 'field') {
      const data = { id, label, color: cm.get(...node.fields) }
      elements.push({ data })
      return
    }
    if (node.type === 'class' && node.bundles.size === 0) {
      const data = { id, label, color: 'black' }
      elements.push({ data })
      return
    }
    if (node.type === 'class' && node.bundles.size > 0) {
      const data = { id, label, color: cm.get(...node.bundles) }
      elements.push({ data })
    }
  }

  protected async addEdgeImpl (elements: Elements, { ns }: ContextFlags, id: string, from: string, to: string, edge: ModelEdge): Promise<undefined> {
    if (edge.type === 'data') {
      const data = { id, source: from, target: to, label: ns.apply(edge.property), color: 'black' }
      elements.push({ data })
      return
    }
    if (edge.type === 'property') {
      const data = { id, source: from, target: to, label: ns.apply(edge.property), color: 'black' }
      elements.push({ data })
      return
    }
    throw new Error('never reached')
  }
}

// spellchecker:words avsdf breadthfirst roundrectangle fcose dagre
