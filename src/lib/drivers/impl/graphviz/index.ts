import {
  type ContextDetails,
  type ContextFlags,
  DriverImpl,
  type MountInfo,
  type Refs,
  type Snapshot,
  type View,
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
} from '../../../graph/builders/model/labels'
import { type Renderable, type Element } from '../../../graph/builders'
import { type Size } from '../../../../components/hooks/observer'

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
  Attributes,
  Attributes,
  Subgraph,
  Context,
  Mount,
  Graph
> {
  static readonly id: string = 'GraphViz'
  static readonly layouts = [defaultLayout, 'dot', 'fdp', 'circo', 'neato']
  protected options({ layout }: ContextFlags<Options>): RenderOptions {
    const engine = layout === defaultLayout ? 'dot' : layout
    return { engine }
  }

  protected newContextImpl(flags: ContextFlags<Options>, seed: number): Graph {
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

  protected async initializeImpl(
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

  protected delayMountUntilAfterResize = true
  protected mountImpl(
    { context }: ContextDetails<Context, Options>,
    element: HTMLElement,
    refs: Refs,
    size?: Size,
  ): Mount {
    // mount the svg we have already rendered
    element.innerHTML = context.svg

    const svg = element.querySelector('svg')
    if (svg === null) {
      throw new Error('unable to mount svg element')
    }

    if (typeof size === 'undefined') {
      throw new Error(
        'never reached: mountImpl called without size despite delayMountUntilAfterResize',
      )
    }
    const { height, width } = size
    svg.style.height = `${height}px`
    svg.style.width = `${width}px`

    // create the svg element and add it to the container
    element.appendChild(svg)

    // add zoom controls
    const zoom = spz.value(svg, {
      maxZoom: 1000,
      minZoom: 1 / 1000,
      controlIconsEnabled: true,
      dblClickZoomEnabled: false,
    })
    zoom.reset()
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

  static readonly formats = ['svg', 'gv']
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
    { color, label, tooltip, shape }: Element,
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
    if (type === 'node' && shape !== null) {
      attributes.shape = shape === 'diamond' ? 'octagon' : shape
    }
    attributes.label = label ?? ''
    attributes.tooltip = tooltip ?? ''
    return attributes
  }

  protected placeNode(
    graph: Graph,
    id: string,
    attributes: Attributes,
    cluster?: Subgraph | undefined,
  ): void {
    ;(cluster ?? graph).nodes.push({
      name: id,
      attributes,
    })
  }
  protected placeEdge(
    graph: Graph,
    id: string,
    from: string,
    to: string,
    attributes: Attributes,
    cluster?: Subgraph | undefined,
  ): void {
    ;(cluster ?? graph).edges.push({
      head: to,
      tail: from,
      attributes,
    })
  }

  protected createCluster(
    context: Graph,
    id: string,
    boxed: boolean,
  ): Subgraph {
    return {
      name: id,
      graphAttributes: { cluster: boxed, tooltip: '' },
      nodeAttributes: {},
      edgeAttributes: {},
      nodes: [],
      edges: [],
      subgraphs: [],
    }
  }
  protected placeCluster(graph: Graph, id: string, cluster: Subgraph): void {
    graph.subgraphs.push(cluster)
  }

  protected getPositionsImpl(
    details: ContextDetails<Context, Options>,
    info: MountInfo<Mount>,
  ): Snapshot['positions'] {
    return {}
  }
  protected setPositionsImpl(
    details: ContextDetails<Context, Options>,
    info: MountInfo<Mount>,
    positions: Snapshot['positions'],
  ): void {}

  protected getViewImpl(
    details: ContextDetails<Context, Options>,
    { mount: { zoom } }: MountInfo<Mount>,
  ): View | null {
    const { x, y } = zoom.getPan()
    return {
      zoom: zoom.getZoom(),
      center: { x, y },
    }
  }
  protected setViewImpl(
    details: ContextDetails<Context, Options>,
    { mount: { zoom } }: MountInfo<Mount>,
    view: View,
  ): Mount | void {
    zoom.zoom(view.zoom)
    zoom.pan(view.center)
  }
}

export class GraphVizBundleDriver extends GraphvizDriver<
  BundleNode,
  BundleEdge,
  BundleOptions,
  never
> {
  readonly driver = GraphVizBundleDriver
}

export class GraphVizModelDriver extends GraphvizDriver<
  ModelNode,
  ModelEdge,
  ModelOptions,
  ModelAttachmentKey
> {
  readonly driver = GraphVizModelDriver
}

export class GraphVizRDFDriver extends GraphvizDriver<
  RDFNode,
  RDFEdge,
  RDFOptions,
  never
> {
  readonly driver = GraphVizRDFDriver
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
