import {
  type ContextFlags,
  DriverImpl,
  type MountFlags,
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
import { modelNodeLabel } from '../../../graph/builders/model/dedup'
import {
  type ModelOptions,
  type ModelEdge,
  type ModelNode,
  LiteralModelNode,
  ConceptModelNode,
} from '../../../graph/builders/model/types'

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
  readonly supportedLayouts = [defaultLayout, 'dot', 'fdp', 'circo', 'neato']
  protected options({ layout }: ContextFlags<Options>): RenderOptions {
    const engine = layout === defaultLayout ? 'dot' : layout
    return { engine }
  }

  protected async newContextImpl(): Promise<Graph> {
    return {
      name: '',
      strict: false,
      directed: true,
      graphAttributes: { compound: true },
      nodeAttributes: { label: '""', tooltip: '' },
      edgeAttributes: { label: '', tooltip: '' },
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
      svg,
    }
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

  protected mountImpl(context: Context, flags: MountFlags<Options>): Mount {
    // mount the svg we have already rendered
    flags.container.innerHTML = context.svg
    const svg = flags.container.querySelector('svg')
    if (svg === null) {
      throw new Error('unable to mount svg element')
    }

    // create the svg element and add it to the container
    svg.style.height = `${flags.currentSize.height}px`
    svg.style.width = `${flags.currentSize.width}px`
    flags.container.appendChild(svg)

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
    { svg, zoom }: Mount,
    ctx: Context,
    flags: MountFlags<Options>,
    { width, height }: Size,
  ): undefined {
    svg.style.height = `${height}px`
    svg.style.width = `${width}px`
    zoom.resize()
    return undefined
  }

  protected unmountImpl(
    { svg, zoom }: Mount,
    ctx: Context,
    { container }: MountFlags<Options>,
  ): void {
    zoom.destroy()
    container.removeChild(svg)
  }

  readonly supportedExportFormats = ['svg', 'gv']
  protected async exportImpl(
    { canon, svg }: Context,
    flags: ContextFlags<Options>,
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
      attributes: {},
    })
  }
}

class GraphVizModelDriver extends GraphvizDriver<
  ModelNode,
  ModelEdge,
  ModelOptions
> {
  readonly driverName: string
  constructor(public readonly compact: boolean) {
    super()
    this.driverName = compact ? 'GraphViz-compact' : 'GraphViz'
  }

  static readonly #defaultColor = 'black'

  protected addNodeImpl(
    graph: Graph,
    flags: ContextFlags<ModelOptions>,
    id: string,
    node: ModelNode,
  ): undefined {
    if (node instanceof LiteralModelNode) {
      this.#makeFieldNodes(graph, flags, id, node)
      return
    }
    const {
      options: {
        ns,
        cm,
        display: {
          Components: { ConceptLabels },
        },
      },
    } = flags
    if (node instanceof ConceptModelNode && node.bundles.size === 0) {
      graph.nodes.push({
        name: id,
        attributes: {
          label: ConceptLabels ? ns.apply(node.clz) : '',
          tooltip: ConceptLabels ? node.clz : '',

          style: 'filled',
          fillcolor: cm.defaultColor,
        },
      })
      return
    }
    if (node instanceof ConceptModelNode && node.bundles.size > 0) {
      this.#makeBundleNodes(graph, flags, id, node)
      return
    }
    throw new Error('never reached')
  }

  #makeBundleNodes(
    graph: Graph,
    { options: { ns, cm } }: ContextFlags<ModelOptions>,
    id: string,
    node: ConceptModelNode,
  ): void {
    if (this.compact) {
      graph.nodes.push({
        name: id,
        attributes: {
          label: modelNodeLabel(node, ns),
          tooltip: node.clz,

          style: 'filled',
          fillcolor: cm.getDefault(...node.bundles),
        },
      })
      return
    }

    const { clz, bundles } = node

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
      name: id,
      attributes: {
        label: ns.apply(clz),
        tooltip: node.clz,

        shape: 'box',
      },
    })

    Array.from(bundles).forEach((bundle, idx) => {
      const bundleID = `${id}-${idx}`
      sg.nodes.push({
        name: bundleID,
        attributes: {
          label: 'Bundle ' + bundle.path.name,
          tooltip: bundle.path.id,

          shape: 'box',
          style: 'filled',
          fillcolor: cm.getDefault(bundle),
        },
      })
      sg.edges.push({
        head: id,
        tail: bundleID,
        attributes: {},
      })
    })

    graph.subgraphs.push(sg)
  }

  #makeFieldNodes(
    graph: Graph,
    { options: { ns, cm } }: ContextFlags<ModelOptions>,
    id: string,
    node: LiteralModelNode,
  ): void {
    const label = modelNodeLabel(node, ns)
    if (this.compact) {
      graph.nodes.push({
        name: id,
        attributes: {
          label,
          tooltip: Array.from(node.fields)
            .map(f => f.path.id)
            .join('\n'),

          style: 'filled',
          fillcolor: cm.getDefault(...node.fields), // TODO: make this custom
        },
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
      name: id,
      attributes: {
        label: 'Literal',
        tooltip: 'Literal',

        shape: 'box',
      },
    })

    Array.from(node.fields).forEach((field, idx) => {
      const fieldID = `${id}-${idx}`
      sg.nodes.push({
        name: fieldID,
        attributes: {
          label: field.path.name,
          tooltip: field.path.id,

          style: 'filled',
          fillcolor: cm.getDefault(field),
        },
      })
      sg.edges.push({
        head: fieldID,
        tail: id,

        attributes: {
          label: field.path.informativeFieldType ?? '',
          tooltip: field.path.informativeFieldType ?? '',
        },
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
      attributes: {
        label: element.label ?? '',
        tooltip: element.label ?? '',
        color: element.color ?? GraphVizModelDriver.#defaultColor,
      },
    })
  }
}

export class CompactGraphVizModelDriver extends GraphVizModelDriver {
  constructor() {
    super(true)
  }
}

export class RegularGraphVizModelDriver extends GraphVizModelDriver {
  constructor() {
    super(false)
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

interface Node {
  name: string
  attributes: Attributes
}

interface Edge {
  tail: string
  head: string
  attributes?: Attributes
}

interface Subgraph {
  name: string
  graphAttributes: Attributes
  nodeAttributes: Attributes
  edgeAttributes: Attributes
  nodes: Node[]
  edges: Edge[]
  subgraphs: Subgraph[]
}

type Attributes = Record<string, string | number | boolean | HTMLString>

interface HTMLString {
  html: string
}

// spellchecker:words fillcolor circo neato
