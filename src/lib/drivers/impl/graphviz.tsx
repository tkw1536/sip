import { type ContextFlags, defaultLayout, DriverImpl, type MountFlags, type Size } from '.'
import { type BundleEdge, type BundleNode } from '../../graph/builders/bundle'
import { type RenderOptions } from '@viz-js/viz'
import { type ModelEdge, type ModelNode, modelNodeLabel } from '../../graph/builders/model'
import svgPanZoom from 'svg-pan-zoom'
import { type GraphVizResponse, type GraphVizRequest } from './graphviz-worker'
import { Type } from '../../utils/media'

interface HotContext {
  source: string
}
interface Context extends HotContext {
  canon: string
  svg: string
}

interface Mount {
  svg: SVGSVGElement
  zoom: SvgPanZoom.Instance
}

abstract class GraphvizDriver<NodeLabel, EdgeLabel> extends DriverImpl<NodeLabel, EdgeLabel, Context, Mount, HotContext> {
  protected async addNodeImpl (context: HotContext, flags: ContextFlags, id: string, node: NodeLabel): Promise<undefined> {
    context.source += '\n' + this.addNodeAsString(flags, id, node)
  }
  protected abstract addNodeAsString (flags: ContextFlags, id: string, node: NodeLabel): string

  protected async addEdgeImpl (context: HotContext, flags: ContextFlags, id: string, from: string, to: string, edge: EdgeLabel): Promise<undefined> {
    context.source += '\n' + this.addEdgeAsString(flags, id, from, to, edge)
  }
  protected abstract addEdgeAsString (flags: ContextFlags, id: string, from: string, to: string, edge: EdgeLabel): string

  readonly driverName: string = 'GraphViz'
  readonly supportedLayouts = [defaultLayout, 'dot', 'fdp', 'circo', 'neato']
  protected options ({ layout }: ContextFlags): RenderOptions {
    const engine = layout === defaultLayout ? 'dot' : layout
    return { engine }
  }

  protected async newContextImpl (): Promise<HotContext> {
    return {
      source: 'digraph { compound=true;'
    }
  }

  protected async finalizeContextImpl (ctx: HotContext, flags: ContextFlags): Promise<Context> {
    const source = ctx.source + '}'

    // build options for the driver to render
    const options = this.options(flags)

    const canon = await GraphvizDriver.callWorker({ input: source, options: { ...options, format: 'canon' } })
    const svg = await GraphvizDriver.callWorker({ input: canon, options: { ...options, format: 'svg' } })

    return {
      source,
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

function makeNode (id: string, quoted: Record<string, string>, raw: Record<string, string>): string {
  return quote(id) + makeBody(quoted, raw)
}

function makeEdge (from: string, to: string, quoted: Record<string, string>, raw: Record<string, string>): string {
  return quote(from) + '->' + quote(to) + makeBody(quoted, raw)
}

function makeBody (quoted: Record<string, string>, raw: Record<string, string>): string {
  const quoteAttrs = Object.entries(quoted).map(([attr, value]) => `${attr}=${quote(value)}`)
  const rawAttrs = Object.entries(raw).map(([attr, value]) => `${attr}=${value}`)
  const attrs = [...quoteAttrs, ...rawAttrs]
  return (attrs.length > 0) ? ` [${attrs.join(' ')}]` : ''
}

function quote (value: string): string {
  return '"' + value.replaceAll('"', '\\"') + '"'
}

export class GraphVizBundleDriver extends GraphvizDriver<BundleNode, BundleEdge> {
  protected addNodeAsString ({ cm }: ContextFlags, id: string, node: BundleNode): string {
    if (node.type === 'bundle') {
      const path = node.bundle.path
      return makeNode(id, { label: 'Bundle\n' + path.name, fillcolor: cm.get(node.bundle) }, { style: 'filled' })
    }
    if (node.type === 'field') {
      const path = node.field.path
      return makeNode(id, { label: path.name, fillcolor: cm.get(node.field) }, { style: 'filled' })
    }
    throw new Error('never reached')
  }

  protected addEdgeAsString (flags: ContextFlags, id: string, from: string, to: string, edge: BundleEdge): string {
    return makeEdge(from, to, {}, {})
  }
}

export class GraphVizModelDriver extends GraphvizDriver<ModelNode, ModelEdge> {
  readonly driverName: string
  constructor (public readonly compact: boolean) {
    super()
    this.driverName = compact ? 'GraphViz-compact' : 'GraphViz'
  }

  protected addNodeAsString (flags: ContextFlags, id: string, node: ModelNode): string {
    if (node.type === 'field') {
      return this.makeFieldNodes(flags, id, node)
    }
    if (node.type === 'class' && node.bundles.size === 0) {
      return makeNode(
        id,
        {
          label: flags.ns.apply(node.clz),
          fillcolor: flags.cm.defaultColor
        },
        {
          style: 'filled'
        }
      )
    }
    if (node.type === 'class' && node.bundles.size > 0) {
      return this.makeBundleNodes(flags, id, node)
    }
    throw new Error('never reached')
  }

  private makeBundleNodes ({ ns, cm }: ContextFlags, id: string, node: ModelNode & { type: 'class' }): string {
    if (this.compact) {
      return makeNode(
        id,
        {
          label: modelNodeLabel(node, ns),
          fillcolor: cm.get(...node.bundles)
        },
        {
          style: 'filled'
        }
      )
    }

    const { clz, bundles } = node
    let output = 'subgraph { cluster=true;\n'

    output += makeNode(
      id,
      {
        label: ns.apply(clz)
      },
      {
        shape: 'box'
      }
    ) + '\n'

    Array.from(bundles).forEach((bundle, idx) => {
      const bundleID = `${id}-${idx}`
      const node = makeNode(
        bundleID,
        {
          label: 'Bundle ' + bundle.path.name,
          fillcolor: cm.get(bundle)
        },
        {
          shape: 'box',
          style: 'filled'
        }
      )
      output += node + '\n'
      output += makeEdge(bundleID, id, {}, {}) + '\n'
    })

    output += '}'
    return output
  }

  private makeFieldNodes ({ ns, cm }: ContextFlags, id: string, node: ModelNode & { type: 'field' }): string {
    if (this.compact) {
      return makeNode(
        id,
        {
          label: modelNodeLabel(node, ns),
          fillcolor: cm.get(...node.fields)
        },
        {
          style: 'filled'
        }
      )
    }
    let output = 'subgraph { cluster=true;\n'

    output += makeNode(
      id,
      { label: 'Literal' },
      { shape: 'box' }
    ) + '\n'

    Array.from(node.fields).forEach((field, idx) => {
      const fieldID = `${id}-${idx}`
      const node = makeNode(
        fieldID,
        {
          label: field.path.name,
          fillcolor: cm.get(field)
        },
        {
          style: 'filled'
        }
      )
      output += node + '\n'
      output += makeEdge(id, fieldID, { label: field.path.informativeFieldType }, {}) + '\n'
    })

    output += '}'

    return output
  }

  protected addEdgeAsString ({ ns }: ContextFlags, id: string, from: string, to: string, edge: ModelEdge): string {
    const properties: Record<string, string> = {
      label: ns.apply(edge.property)
    }
    return makeEdge(
      from, to,
      properties,
      {}
    )
  }
}

// spellchecker:words fillcolor circo neato
