import { type ContextFlags, defaultLayout, DriverImpl, type MountFlags, type Size } from '.'
import { type BundleEdge, type BundleNode } from '../../graph/builders/bundle'
import { type RenderOptions } from '@viz-js/viz'
import { type ModelEdge, type ModelNode, modelNodeLabel } from '../../graph/builders/model'
import svgPanZoom from 'svg-pan-zoom'
import { type GraphVizResponse, type GraphVizRequest } from './graphviz-worker'
import { Type } from '../../utils/media'

interface Context {
  graph: Graph
  canon: string
  svg: string
}

interface Mount {
  svg: SVGSVGElement
  zoom: SvgPanZoom.Instance
}

abstract class GraphvizDriver<NodeLabel, EdgeLabel> extends DriverImpl<NodeLabel, EdgeLabel, Context, Mount, FullGraph> {
  readonly driverName: string = 'GraphViz'
  readonly supportedLayouts = [defaultLayout, 'dot', 'fdp', 'circo', 'neato']
  protected options ({ layout }: ContextFlags): RenderOptions {
    const engine = layout === defaultLayout ? 'dot' : layout
    return { engine }
  }

  protected async newContextImpl (): Promise<FullGraph> {
    return {
      name: '',
      strict: false,
      directed: true,
      graphAttributes: { compound: true },
      nodeAttributes: {},
      edgeAttributes: {},
      nodes: [],
      edges: [],
      subgraphs: []
    }
  }

  protected async finalizeContextImpl (graph: FullGraph, flags: ContextFlags): Promise<Context> {
    // build options for the driver to render
    const options = this.options(flags)

    const canon = await GraphvizDriver.callWorker({ input: graph, options: { ...options, format: 'canon' } })
    const svg = await GraphvizDriver.callWorker({ input: canon, options: { ...options, format: 'svg' } })

    return {
      graph,
      canon,
      svg
    }
  }

  /** callWorker spawns GraphViz in a background and has it render */
  private static async callWorker (message: GraphVizRequest): Promise<string> {
    const worker = new Worker(new URL('graphviz-worker.tsx', import.meta.url), { type: 'module' })
    return await new Promise<string>((resolve, reject) => {
      worker.onmessage = (e) => {
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

  protected mountImpl (context: Context, flags: MountFlags): Mount {
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
    const zoom = svgPanZoom(svg, { maxZoom: 1000, minZoom: 1 / 1000, controlIconsEnabled: true, dblClickZoomEnabled: false })
    return { svg, zoom }
  }

  protected resizeMountImpl ({ svg, zoom }: Mount, ctx: Context, flags: MountFlags, { width, height }: Size): undefined {
    svg.style.height = `${height}px`
    svg.style.width = `${width}px`
    return undefined
  }

  protected unmountImpl ({ svg, zoom }: Mount, ctx: Context, { container }: MountFlags): void {
    zoom.destroy()
    container.removeChild(svg)
  }

  readonly supportedExportFormats = ['svg', 'gv']
  protected async objectToBlobImpl (mount: Mount, { canon, svg }: Context, flags: MountFlags, format: string): Promise<Blob> {
    switch (format) {
      case 'svg':
      {
        return new Blob([svg], { type: Type.SVG })
      }
      case 'gv':
      {
        return new Blob([canon], { type: Type.GRAPHVIZ })
      }
    }
    throw new Error('never reached')
  }
}

export class GraphVizBundleDriver extends GraphvizDriver<BundleNode, BundleEdge> {
  protected addNodeImpl (graph: FullGraph, { cm }: ContextFlags, id: string, node: BundleNode): undefined {
    if (node.type === 'bundle') {
      const path = node.bundle.path
      graph.nodes.push({
        name: id,
        attributes: {
          label: 'Bundle\n' + path.name,
          tooltip: path.id,

          style: 'filled',
          fillcolor: cm.get(node.bundle)
        }
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
          fillcolor: cm.get(node.field)
        }
      })
      return
    }
    throw new Error('never reached')
  }

  protected addEdgeImpl (graph: FullGraph, flags: ContextFlags, id: string, from: string, to: string, edge: BundleEdge): undefined {
    graph.edges.push({
      tail: from,
      head: to,
      attributes: {}
    })
  }
}

export class GraphVizModelDriver extends GraphvizDriver<ModelNode, ModelEdge> {
  readonly driverName: string
  constructor (public readonly compact: boolean) {
    super()
    this.driverName = compact ? 'GraphViz-compact' : 'GraphViz'
  }

  protected addNodeImpl (graph: FullGraph, flags: ContextFlags, id: string, node: ModelNode): undefined {
    if (node.type === 'field') {
      this.makeFieldNodes(graph, flags, id, node)
      return
    }
    if (node.type === 'class' && node.bundles.size === 0) {
      graph.nodes.push({
        name: id,
        attributes: {
          label: flags.ns.apply(node.clz),
          tooltip: node.clz,

          style: 'filled',
          fillcolor: flags.cm.defaultColor
        }
      })
      return
    }
    if (node.type === 'class' && node.bundles.size > 0) {
      this.makeBundleNodes(graph, flags, id, node)
      return
    }
    throw new Error('never reached')
  }

  private makeBundleNodes (graph: FullGraph, { ns, cm }: ContextFlags, id: string, node: ModelNode & { type: 'class' }): void {
    if (this.compact) {
      graph.nodes.push({
        name: id,
        attributes: {
          label: modelNodeLabel(node, ns),
          tooltip: node.clz,

          style: 'filled',
          fillcolor: cm.get(...node.bundles)
        }

      })
      return
    }

    const { clz, bundles } = node

    const sg: FullSubgraph = {
      name: `subgraph-${id}`,
      graphAttributes: { cluster: true, tooltip: '' },
      nodeAttributes: {},
      edgeAttributes: {},
      nodes: [],
      edges: [],
      subgraphs: []
    }

    sg.nodes.push({
      name: id,
      attributes: {
        label: ns.apply(clz),
        tooltip: node.clz,

        shape: 'box'
      }
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
          fillcolor: cm.get(bundle)
        }
      })
      sg.edges.push({
        head: id,
        tail: bundleID,
        attributes: {}
      })
    })

    graph.subgraphs.push(sg)
  }

  private makeFieldNodes (graph: FullGraph, { ns, cm }: ContextFlags, id: string, node: ModelNode & { type: 'field' }): void {
    const label = modelNodeLabel(node, ns)
    if (this.compact) {
      graph.nodes.push({
        name: id,
        attributes: {
          label,
          tooltip: Array.from(node.fields).map(f => f.path.id).join('\n'),

          style: 'filled',
          fillcolor: cm.get(...node.fields) // TODO: make this custom
        }
      })
      return
    }

    const sg: FullSubgraph = {
      name: `subgraph-${id}`,
      graphAttributes: { cluster: true, tooltip: '' },
      nodeAttributes: {},
      edgeAttributes: {},
      nodes: [],
      edges: [],
      subgraphs: []
    }

    sg.nodes.push({
      name: id,
      attributes: {
        label: 'Literal',
        tooltip: 'Literal',

        shape: 'box'
      }
    })

    Array.from(node.fields).forEach((field, idx) => {
      const fieldID = `${id}-${idx}`
      sg.nodes.push({
        name: fieldID,
        attributes: {
          label: field.path.name,
          tooltip: field.path.id,

          style: 'filled',
          fillcolor: cm.get(field)
        }
      })
      sg.edges.push({
        head: fieldID,
        tail: id,

        attributes: {
          label: field.path.informativeFieldType,
          tooltip: field.path.informativeFieldType
        }
      })
    })

    graph.subgraphs.push(sg)
  }

  protected addEdgeImpl (graph: FullGraph, { ns }: ContextFlags, id: string, from: string, to: string, edge: ModelEdge): undefined {
    graph.edges.push({
      head: to,
      tail: from,
      attributes: {
        label: ns.apply(edge.property),
        tooltip: edge.property
      }
    })
  }
}

interface Graph extends Subgraph {
  strict?: boolean
  directed?: boolean
}
interface FullGraph extends FullSubgraph {
  strict: boolean
  directed: boolean
}

interface Node {
  name: string
  attributes?: Attributes
}
type FullNode = Required<Node>

interface Edge {
  tail: string
  head: string
  attributes?: Attributes
}
type FullEdge = Required<Edge>

interface Subgraph {
  name?: string
  graphAttributes?: Attributes
  nodeAttributes?: Attributes
  edgeAttributes?: Attributes
  nodes?: Node[]
  edges?: Edge[]
  subgraphs?: Subgraph[]
}
interface FullSubgraph {
  name: string
  graphAttributes: Attributes
  nodeAttributes: Attributes
  edgeAttributes: Attributes
  nodes: FullNode[]
  edges: FullEdge[]
  subgraphs: FullSubgraph[]
}

type Attributes = Record<string, string | number | boolean | HTMLString>

interface HTMLString {
  html: string
}

// spellchecker:words fillcolor circo neato
