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
  LiteralModelNode,
  ConceptModelNode,
  type Element,
} from '../../../graph/builders/model/labels'

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

abstract class GraphvizDriver<NodeLabel, EdgeLabel, Options> extends DriverImpl<
  NodeLabel,
  EdgeLabel,
  Options,
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
  ): undefined {
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
}

export class GraphVizBundleDriver extends GraphvizDriver<
  BundleNode,
  BundleEdge,
  BundleOptions
> {
  protected addNodeImpl(
    graph: Graph,
    { options: { cm } }: ContextFlags<BundleOptions>,
    id: string,
    node: BundleNode,
  ): undefined {
    if (node.type === 'bundle') {
      const path = node.bundle.path
      graph.nodes.push({
        name: id,
        attributes: {
          label: 'Bundle\n' + path.name,
          tooltip: path.id,

          style: 'filled',
          fillcolor: cm.getDefault(node.bundle),
        },
      })
      return
    }
    if (node.type === 'field') {
      const path = node.field.path
      graph.nodes.push({
        name: id,
        attributes: {
          label: path.name,
          tooltip: path.id,

          style: 'filled',
          fillcolor: cm.getDefault(node.field),
        },
      })
      return
    }
    throw new Error('never reached')
  }

  protected addEdgeImpl(
    graph: Graph,
    flags: ContextFlags<BundleOptions>,
    id: string,
    from: string,
    to: string,
    edge: BundleEdge,
  ): undefined {
    graph.edges.push({
      tail: from,
      head: to,
      attributes: {
        label: '',
        tooltip: '',
      },
    })
  }
}

export class GraphVizModelDriver extends GraphvizDriver<
  ModelNode,
  ModelEdge,
  ModelOptions
> {
  readonly driverName: string = 'GraphViz'

  static readonly #defaultEdgeColor = 'black'
  static readonly #defaultNodeColor = 'white'

  static #nodeData(display: Element, extra?: Attributes): Attributes {
    const typeAttrs = {
      style: 'filled',
      fillcolor: display.color ?? this.#defaultNodeColor,
    }
    return {
      label: display.label ?? '',
      tooltip: display.tooltip ?? '',
      ...typeAttrs,
      ...(extra ?? {}),
    }
  }

  static #edgeData(display: Element, extra?: Attributes): Attributes {
    const typeAttrs = {
      color: display.color ?? this.#defaultEdgeColor,
    }
    return {
      label: display.label ?? '',
      tooltip: display.tooltip ?? '',
      ...typeAttrs,
      ...(extra ?? {}),
    }
  }

  protected addNodeImpl(
    graph: Graph,
    { options }: ContextFlags<ModelOptions>,
    id: string,
    node: ModelNode,
  ): undefined {
    if (node instanceof LiteralModelNode) {
      this.#addLiteralNode(graph, options, id, node)
      return
    }
    if (node instanceof ConceptModelNode) {
      this.#addConceptNode(graph, options, id, node)
      return
    }
    throw new Error('never reached')
  }

  #addLiteralNode(
    graph: Graph,
    options: ModelOptions,
    id: string,
    node: LiteralModelNode,
  ): void {
    const element = node.render(id, options)
    if (typeof element.attached === 'undefined') {
      graph.nodes.push({
        name: element.id,
        attributes: GraphVizModelDriver.#nodeData(element, {
          shape: 'box',
        }),
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
      attributes: GraphVizModelDriver.#nodeData(element),
    })

    element.attached.fields.forEach(({ node, edge }) => {
      sg.nodes.push({
        name: node.id,
        attributes: GraphVizModelDriver.#nodeData(node, {
          shape: 'box',
        }),
      })
      sg.edges.push({
        head: element.id,
        tail: node.id,

        attributes: GraphVizModelDriver.#edgeData(edge),
      })
    })

    graph.subgraphs.push(sg)
  }

  #addConceptNode(
    graph: Graph,
    options: ModelOptions,
    id: string,
    node: ConceptModelNode,
  ): void {
    const element = node.render(id, options)
    if (typeof element.attached === 'undefined') {
      graph.nodes.push({
        name: element.id,
        attributes: GraphVizModelDriver.#nodeData(element),
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
      attributes: GraphVizModelDriver.#nodeData(element),
    })

    element.attached.bundles.forEach(({ node, edge }) => {
      sg.nodes.push({
        name: node.id,
        attributes: GraphVizModelDriver.#nodeData(node, {
          shape: 'box',
        }),
      })
      sg.edges.push({
        head: element.id,
        tail: node.id,

        attributes: GraphVizModelDriver.#nodeData(edge),
      })
    })

    element.attached.fields.forEach(({ node, edge }) => {
      sg.nodes.push({
        name: node.id,
        attributes: GraphVizModelDriver.#nodeData(node, {
          shape: 'box',
        }),
      })
      sg.edges.push({
        head: element.id,
        tail: node.id,

        attributes: GraphVizModelDriver.#edgeData(edge),
      })
    })

    graph.subgraphs.push(sg)
  }

  protected addEdgeImpl(
    graph: Graph,
    { options }: ContextFlags<ModelOptions>,
    id: string,
    from: string,
    to: string,
    edge: ModelEdge,
  ): undefined {
    const element = edge.render(id, options)
    graph.edges.push({
      head: to,
      tail: from,
      attributes: GraphVizModelDriver.#edgeData(element),
    })
  }
}

export class GraphVizRDFDriver extends GraphvizDriver<
  RDFNode,
  RDFEdge,
  RDFOptions
> {
  static readonly colors: Record<RDFNode['termType'], string> = {
    BlankNode: 'yellow',
    Literal: 'blue',
    NamedNode: 'green',
    Variable: 'red',
    Collection: 'orange',
    Empty: 'white',
  }

  protected addNodeImpl(
    graph: Graph,
    flags: ContextFlags<RDFOptions>,
    id: string,
    node: RDFNode,
  ): undefined {
    const attributes: Attributes = {
      shape: 'ellipse',
      style: 'filled',
      fillcolor: GraphVizRDFDriver.colors[node.termType],
    }

    switch (node.termType) {
      case 'BlankNode' /** fallthrough */:
        attributes.label = node.id
        attributes.tooltip = node.id
        break
      case 'NamedNode':
        attributes.label = flags.options.ns.apply(node.uri)
        attributes.tooltip = node.uri
        break
      case 'Literal':
        attributes.shape = 'box'
        attributes.label = node.value
        attributes.tooltip = node.termType
        break
      case 'Variable':
        attributes.label = '?' + node.value
        attributes.tooltip = '?' + node.value
        break
      case 'Collection':
        attributes.label = 'Collection'
        attributes.tooltip = 'Collection'
        break
      case 'Empty':
        attributes.label = 'Empty'
        attributes.tooltip = 'Empty'
        break
      default:
        throw new Error('never reached')
    }
    graph.nodes.push({
      name: id,
      attributes,
    })
  }

  protected addEdgeImpl(
    graph: Graph,
    { options: { ns } }: ContextFlags<RDFOptions>,
    id: string,
    from: string,
    to: string,
    edge: RDFEdge,
  ): undefined {
    const attributes =
      edge.termType === 'NamedNode'
        ? { label: ns.apply(edge.uri), tooltip: edge.uri }
        : { label: '?' + edge.value, tooltip: '?' + edge.value }

    graph.edges.push({
      head: to,
      tail: from,
      attributes,
    })
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
