import {
  type ContextDetails,
  type ContextFlags,
  DriverImpl,
  type MountInfo,
  type Size,
  defaultLayout,
} from '..'
import {
  type BundleOptions,
  type BundleEdge,
  type BundleNode,
} from '../../../graph/builders/bundle'
import { type RenderOptions } from '@viz-js/viz'
import { Type } from '../../../utils/media'
import { type GraphVizRequest, type GraphVizResponse } from './impl'
import { LazyValue } from '../../../utils/once'
// lazy import svg-pan-zoom (so that we can skip loading it in server-side mode)
import { type default as SvgPanZoom } from 'svg-pan-zoom'
import {
  type RDFOptions,
  type RDFEdge,
  type RDFNode,
} from '../../../graph/builders/rdf'
import {
  type ModelOptions,
  type ModelEdge,
  type ModelNode,
  type ModelAttachmentKey,
  LiteralModelNode,
} from '../../../graph/builders/model/labels'
import {
  type Renderable,
  type Element,
  type ElementWithAttachments,
  type Attachment,
} from '../../../graph/builders'

const spz = new LazyValue(
  async () => await import('svg-pan-zoom').then(spz => spz.default),
)

interface Context {
  graph: Graph
  canon: string
  svg: string
}

interface Mount {
  svg: SVGSVGElement
  zoom: SvgPanZoom.Instance
}

abstract class GraphvizDriver<
  NodeLabel extends Renderable<Options, AttachmentKey>,
  EdgeLabel extends Renderable<Options, AttachmentKey>,
  Options,
  AttachmentKey extends string,
> extends DriverImpl<
  NodeLabel,
  EdgeLabel,
  Options,
  AttachmentKey,
  Context,
  Mount,
  Graph
> {
  readonly driverName: string = 'GraphViz'
  readonly layouts = [defaultLayout, 'dot', 'fdp', 'circo', 'neato']
  protected options({ layout }: ContextFlags<Options>): RenderOptions {
    const engine = layout === defaultLayout ? 'dot' : layout
    return { engine }
  }

  protected async newContextImpl(
    flags: ContextFlags<Options>,
    seed: number,
  ): Promise<Graph> {
    return {
      name: '',
      strict: false,
      directed: true,
      graphAttributes: { compound: true, start: seed },
      nodeAttributes: { label: '""', tooltip: '""' },
      edgeAttributes: { label: '""', tooltip: '""' },
      nodes: [],
      edges: [],
      subgraphs: [],
    }
  }

  protected async finalizeContextImpl(
    graph: Graph,
    flags: ContextFlags<Options>,
  ): Promise<Context> {
    // build options for the driver to render
    const options = this.options(flags)

    if (Object.hasOwn(globalThis, 'window')) {
      await spz.load()
    }

    const canon = await GraphvizDriver.#callImpl({
      input: graph,
      options: { ...options, format: 'canon' },
    })
    const svg = await GraphvizDriver.#callImpl({
      input: canon,
      options: { ...options, format: 'svg' },
    })

    return {
      graph,
      canon,
      svg: await GraphvizDriver.#removeTitleHack(svg),
    }
  }

  static async #removeTitleHack(svg: string): Promise<string> {
    const { DOMParser, XMLSerializer } = await import('@xmldom/xmldom')
    const doc = new DOMParser().parseFromString(svg, 'image/svg+xml')

    const nodes: Node[] = [doc.documentElement]
    while (nodes.length > 0) {
      const node = nodes.shift()
      if (typeof node === 'undefined') {
        break
      }
      if (node.nodeType === node.ELEMENT_NODE && node.nodeName === 'title') {
        node.parentNode?.removeChild(node)
        continue
      }

      nodes.push(...Array.from(node.childNodes ?? []))
    }

    return new XMLSerializer().serializeToString(doc)
  }

  /** callWorker spawns GraphViz in a background and has it render */
  static async #callImpl(message: GraphVizRequest): Promise<string> {
    // check if we have a worker available
    // and if so, call it!
    if (Object.hasOwn(globalThis, 'Worker')) {
      return await this.#callWorkerImpl(message)
    }

    // if not, use a lazy loading implementation
    return await this.#callImportImpl(message)
  }

  static async #callImportImpl(message: GraphVizRequest): Promise<string> {
    const { processRequest } = await import('./impl')
    return await processRequest(message)
  }

  static async #callWorkerImpl(message: GraphVizRequest): Promise<string> {
    const worker = new Worker(new URL('./worker.ts', import.meta.url), {
      type: 'module',
    })
    return await new Promise<string>((resolve, reject) => {
      worker.onmessage = e => {
        worker.terminate()

        const data: GraphVizResponse = e.data
        if (!data.success) {
          reject(new Error(data.message))
          return
        }
        resolve(data.result)
      }
      worker.postMessage(message)
    })
  }

  protected mountImpl(
    { context, flags: { size } }: ContextDetails<Context, Options>,
    element: HTMLElement,
  ): Mount {
    // mount the svg we have already rendered
    element.innerHTML = context.svg

    const svg = element.querySelector('svg')
    if (svg === null) {
      throw new Error('unable to mount svg element')
    }

    // create the svg element and add it to the container
    svg.style.height = `${size.height}px`
    svg.style.width = `${size.width}px`
    element.appendChild(svg)

    // add zoom controls
    const zoom = spz.value(svg, {
      maxZoom: 1000,
      minZoom: 1 / 1000,
      controlIconsEnabled: true,
      dblClickZoomEnabled: false,
    })
    return { svg, zoom }
  }

  protected resizeMountImpl(
    details: ContextDetails<Context, Options>,
    { mount: { svg, zoom } }: MountInfo<Mount>,
    { width, height }: Size,
  ): void {
    svg.style.height = `${height}px`
    svg.style.width = `${width}px`
    zoom.resize()
    return undefined
  }

  protected unmountImpl(
    details: ContextDetails<Context, Options>,
    { mount: { svg, zoom }, element }: MountInfo<Mount>,
  ): void {
    zoom.destroy()
    element.removeChild(svg)
  }

  readonly exportFormats = ['svg', 'gv']
  protected async exportImpl(
    { context: { canon, svg } }: ContextDetails<Context, Options>,
    info: MountInfo<Mount> | null,
    format: string,
  ): Promise<Blob> {
    switch (format) {
      case 'svg': {
        return new Blob([svg], { type: Type.SVG })
      }
      case 'gv': {
        return new Blob([canon], { type: Type.GRAPHVIZ })
      }
    }
    throw new Error('never reached')
  }

  protected getSeedImpl(
    details: ContextDetails<Context, Options>,
    info: MountInfo<Mount> | null,
  ): number | null {
    const attrs = details.context.graph.graphAttributes
    if (Object.hasOwn(attrs, 'start')) {
      const { start } = attrs
      if (typeof start === 'number') {
        return start
      }
    }
    return null
  }

  protected startSimulationImpl(
    details: ContextDetails<Context, Options>,
    info: MountInfo<Mount>,
  ): void {}

  protected stopSimulationImpl(
    details: ContextDetails<Context, Options>,
    info: MountInfo<Mount>,
  ): void {}

  protected attributes(
    type: 'node' | 'edge',
    { color, label, tooltip }: Element,
  ): Attributes {
    const attributes: Attributes = {}
    if (typeof color === 'string') {
      if (type === 'node') {
        attributes.style = 'filled'
        attributes.fillcolor = color
      } else {
        attributes.color = color
      }
    }
    attributes.label = label ?? ''
    attributes.tooltip = tooltip ?? ''
    return attributes
  }

  protected addNodeImpl(
    graph: Graph,
    flags: ContextFlags<Options>,
    id: string,
    node: NodeLabel,
    element: ElementWithAttachments<AttachmentKey>,
  ): void {
    const { attached } = element
    if (typeof attached === 'undefined') {
      graph.nodes.push({
        name: element.id,
        attributes: this.renderSimpleNode(node, element),
      })
      return
    }

    const sg: Subgraph = {
      name: `subgraph-${id}`,
      graphAttributes: { cluster: true, tooltip: '' },
      nodeAttributes: {},
      edgeAttributes: {},
      nodes: [],
      edges: [],
      subgraphs: [],
    }

    sg.nodes.push({
      name: element.id,
      attributes: this.renderComplexNode(node, element),
    })

    Object.entries(attached).forEach(([attachment, elements]) => {
      ;(elements as Attachment[]).forEach(({ node: aNode, edge: aEdge }) => {
        sg.nodes.push({
          name: aNode.id,
          attributes: this.renderAttachedNode(
            node,
            attachment as AttachmentKey,
            aNode,
          ),
        })

        sg.edges.push({
          head: element.id,
          tail: aNode.id,
          attributes: this.renderAttachedEdge(
            node,
            attachment as AttachmentKey,
            aEdge,
          ),
        })
      })
    })

    graph.subgraphs.push(sg)
  }

  protected addEdgeImpl(
    graph: Graph,
    flags: ContextFlags<Options>,
    id: string,
    from: string,
    to: string,
    edge: EdgeLabel,
    element: ElementWithAttachments<AttachmentKey>,
  ): void {
    graph.edges.push({
      tail: from,
      head: to,
      attributes: this.renderEdge(edge, element),
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
}

export class GraphVizBundleDriver extends GraphvizDriver<
  BundleNode,
  BundleEdge,
  BundleOptions,
  never
> {}

export class GraphVizModelDriver extends GraphvizDriver<
  ModelNode,
  ModelEdge,
  ModelOptions,
  ModelAttachmentKey
> {
  protected renderAnyNode(
    node: ModelNode,
    element: ElementWithAttachments<ModelAttachmentKey>,
  ): Attributes {
    return {
      ...super.renderAnyNode(node, element),
      shape: node instanceof LiteralModelNode ? 'box' : 'ellipse',
    }
  }
  protected renderAttachedNode(
    parent: ModelNode,
    attachment: ModelAttachmentKey,
    element: Element,
  ): Attributes {
    return {
      ...super.renderAttachedNode(parent, attachment, element),
      // spellchecker:words doubleoctagon
      shape: 'doubleoctagon',
    }
  }
}

export class GraphVizRDFDriver extends GraphvizDriver<
  RDFNode,
  RDFEdge,
  RDFOptions,
  never
> {
  protected renderSimpleNode(
    { node }: RDFNode,
    element: ElementWithAttachments<never>,
  ): Attributes {
    return {
      shape: node.termType !== 'Literal' ? 'ellipse' : 'box',
      ...this.attributes('node', element),
    }
  }
}

/** Graph represents a graph passed to the viz.js implementation */
interface Graph extends Subgraph {
  strict: boolean
  directed: boolean
}

interface GVNode {
  name: string
  attributes: Attributes
}

interface GVEdge {
  tail: string
  head: string
  attributes?: Attributes
}

interface Subgraph {
  name: string
  graphAttributes: Attributes
  nodeAttributes: Attributes
  edgeAttributes: Attributes
  nodes: GVNode[]
  edges: GVEdge[]
  subgraphs: Subgraph[]
}

type Attributes = Record<string, string | number | boolean | HTMLString>

interface HTMLString {
  html: string
}

// spellchecker:words fillcolor circo neato
