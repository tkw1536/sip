import {
  type Core,
  type CytoscapeOptions as _Options,
  type ElementDefinition,
  type Layouts,
} from 'cytoscape'
import {
  type ContextDetails,
  type ContextFlags,
  DriverImpl,
  ErrorUnsupported,
  type MountInfo,
  type Refs,
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
  type ModelAttachmentKey,
} from '../../graph/builders/model/labels'
import {
  type Renderable,
  type Element,
  type ElementWithAttachments,
  type Attachment,
} from '../../graph/builders'
import {
  type RDFEdge,
  type RDFNode,
  type RDFOptions,
} from '../../graph/builders/rdf'

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
interface CytoMount {
  c: Core
  l: Layouts | undefined
}
type CytoscapeOptions = Omit<_Options, 'container' | 'elements'>

type Attributes = Record<string, any>

abstract class CytoscapeDriver<
  NodeLabel extends Renderable<Options, AttachmentKey>,
  EdgeLabel extends Renderable<Options, AttachmentKey>,
  Options,
  AttachmentKey extends string,
> extends DriverImpl<
  NodeLabel,
  EdgeLabel,
  Options,
  AttachmentKey,
  Elements,
  CytoMount
> {
  readonly driverName = 'Cytoscape'
  readonly layouts = [
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
    {
      context: elements,
      flags: { layout, definitelyAcyclic },
    }: ContextDetails<Elements, Options>,
    element: HTMLElement,
    refs: Refs,
  ): CytoMount {
    const options = this.options(layout, definitelyAcyclic)

    const c = Cytoscape.value({
      container: element,
      elements,
      ...options,
    })

    const { layout: layoutOptions } = options
    const l =
      typeof layoutOptions !== 'undefined' ? c.layout(layoutOptions) : undefined

    // spellchecker:words layoutstart layoutstop
    c.on('layoutstart', () => {
      refs.animating(true)
    })
    c.on('layoutstop', () => {
      refs.animating(false)
    })
    if (typeof l !== 'undefined') {
      l.start()
    }

    return { c, l }
  }

  protected resizeMountImpl(
    details: ContextDetails<Elements, Options>,
    info: MountInfo<CytoMount>,
    size: Size,
  ): void {
    /* automatically resized */
  }

  protected unmountImpl(
    details: ContextDetails<Elements, Options>,
    { mount: { c } }: MountInfo<CytoMount>,
  ): void {
    c.destroy()
  }

  readonly exportFormats = []
  protected async exportImpl(
    details: ContextDetails<Elements, Options>,
    info: MountInfo<CytoMount> | null,
    format: string,
  ): Promise<Blob> {
    throw ErrorUnsupported
  }
  protected getSeedImpl(
    details: ContextDetails<Elements, Options>,
    info: MountInfo<CytoMount> | null,
  ): number | null {
    return null // not supported
  }

  protected startSimulationImpl(
    details: ContextDetails<Elements, Options>,
    { mount: { c, l } }: MountInfo<CytoMount>,
  ): void {
    l?.start()
  }

  protected stopSimulationImpl(
    details: ContextDetails<Elements, Options>,
    { mount: { c, l }, refs }: MountInfo<CytoMount>,
  ): void {
    l?.stop()
    c.stop(true)
  }

  protected addNodeImpl(
    elements: Elements,
    flags: ContextFlags<Options>,
    id: string,
    node: NodeLabel,
    element: ElementWithAttachments<AttachmentKey>,
  ): void {
    const { attached } = element
    if (typeof attached === 'undefined') {
      elements.push({
        data: {
          ...this.renderSimpleNode(node, element),
          id: element.id,
        },
      })
      return
    }

    elements.push({
      data: {
        ...this.renderComplexNode(node, element),
        id: element.id,
      },
    })

    Object.entries(attached).forEach(([attachment, sElements]) => {
      ;(sElements as Attachment[]).forEach(({ node: aNode, edge: aEdge }) => {
        elements.push({
          data: {
            ...this.renderAttachedNode(
              node,
              attachment as AttachmentKey,
              aNode,
            ),
            id: aNode.id,
          },
        })

        elements.push({
          data: {
            ...this.renderAttachedEdge(
              node,
              attachment as AttachmentKey,
              aNode,
            ),
            id: aEdge.id,
            source: aNode.id,
            target: element.id,
          },
        })
      })
    })
  }

  protected addEdgeImpl(
    elements: Elements,
    flags: ContextFlags<Options>,
    id: string,
    from: string,
    to: string,
    edge: EdgeLabel,
    element: ElementWithAttachments<AttachmentKey>,
  ): void {
    elements.push({
      data: {
        ...this.renderEdge(edge, element),
        id,
        source: from,
        target: to,
      },
    })
  }

  protected renderSimpleNode(
    node: NodeLabel,
    element: ElementWithAttachments<AttachmentKey>,
  ): Attributes {
    return this.renderAnyNode(node, element)
  }

  protected renderComplexNode(
    node: NodeLabel,
    element: ElementWithAttachments<AttachmentKey>,
  ): Attributes {
    return this.renderAnyNode(node, element)
  }

  protected renderAttachedNode(
    parent: NodeLabel,
    attachment: AttachmentKey,
    element: Element,
  ): Attributes {
    return this.renderAnyNode(parent, element)
  }

  protected renderAnyNode(
    node: NodeLabel,
    element: ElementWithAttachments<AttachmentKey>,
  ): Attributes {
    return this.attributes('node', element)
  }

  protected renderAttachedEdge(
    parent: NodeLabel,
    attachment: AttachmentKey,
    element: Element,
  ): Attributes {
    return this.attributes('edge', element)
  }

  protected renderEdge(
    edge: EdgeLabel,
    element: ElementWithAttachments<AttachmentKey>,
  ): Attributes {
    return this.attributes('edge', element)
  }

  protected attributes(
    type: 'node' | 'edge',
    { color, label, tooltip }: Element,
  ): Attributes {
    return {
      label: label ?? undefined,
      color: color ?? 'black',
    }
  }
}

export class CytoBundleDriver extends CytoscapeDriver<
  BundleNode,
  BundleEdge,
  BundleOptions,
  never
> {}
export class CytoModelDriver extends CytoscapeDriver<
  ModelNode,
  ModelEdge,
  ModelOptions,
  ModelAttachmentKey
> {}
export class CytoRDFDriver extends CytoscapeDriver<
  RDFNode,
  RDFEdge,
  RDFOptions,
  never
> {}

// spellchecker:words avsdf breadthfirst roundrectangle fcose dagre
