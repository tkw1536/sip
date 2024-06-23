import { ContextFlags, defaultLayout, DriverImpl, MountFlags, Size } from '.'
import { BundleEdge, BundleNode } from '../../graph/builders/bundle'
import { instance, RenderOptions, Viz } from '@viz-js/viz'
import { ModelEdge, ModelNode } from '../../graph/builders/model'
import svgPanZoom from 'svg-pan-zoom'

interface Context {
  viz: Viz
  source: string
}

interface Mount {
  svg: SVGSVGElement
  zoom: SvgPanZoom.Instance
}

abstract class GraphvizDriver<NodeLabel, EdgeLabel> extends DriverImpl<NodeLabel, EdgeLabel, Context, Mount> {
  protected async addNodeImpl (context: Context, flags: ContextFlags, id: string, node: NodeLabel): Promise<undefined> {
    context.source += '\n' + this.addNodeAsString(flags, id, node)
  }
  protected abstract addNodeAsString (flags: ContextFlags, id: string, node: NodeLabel): string

  protected async addEdgeImpl (context: Context, flags: ContextFlags, id: string, from: string, to: string, edge: EdgeLabel): Promise<undefined> {
    context.source += '\n' + this.addEdgeAsString(flags, id, from, to, edge)
  }
  protected abstract addEdgeAsString (flags: ContextFlags, id: string, from: string, to: string, edge: EdgeLabel): string

  readonly driverName = 'GraphViz'
  readonly supportedLayouts = [defaultLayout]

  protected async newContextImpl (): Promise<Context> {
    return {
      viz: await instance(),
      source: 'digraph {'
    }
  }

  protected async finalizeContextImpl (ctx: Context): Promise<undefined> {
    ctx.source += '}'
  }

  protected mountImpl (context: Context, flags: MountFlags): Mount {
    // create the svg element and add it to the container
    const svg = context.viz.renderSVGElement(context.source, this.options(flags))
    svg.style.height = `${flags.size.height}px`
    svg.style.width = `${flags.size.width}px`
    flags.container.appendChild(svg)

    // add zoom controls
    const zoom = svgPanZoom(svg)
    return { svg, zoom }
  }

  protected resizeMountImpl ({ svg, zoom }: Mount, ctx: Context, flags: MountFlags, { width, height }: Size): undefined {
    svg.style.height = `${height}px`
    svg.style.width = `${width}px`
    // zoom.resize()
    return undefined
  }

  protected unmountImpl ({ svg, zoom }: Mount, ctx: Context, { container }: MountFlags): void {
    zoom.destroy()
    container.removeChild(svg)
  }

  protected options (flags: MountFlags): RenderOptions {
    return {}
  }

  readonly supportedExportFormats = ['svg', 'dot', 'json']
  protected async objectToBlobImpl ({ svg, zoom }: Mount, { source, viz }: Context, flags: MountFlags, format: string): Promise<Blob> {
    switch (format) {
      case 'svg':
      {
        const output = viz.renderString(source, this.options(flags))
        return new Blob([output], { type: 'image/svg+xml' })
      }
      case 'dot':
        return new Blob([source], { type: 'text/vnd.graphviz' })
      case 'json':
      {
        const output = viz.renderJSON(source, this.options(flags))
        return new Blob([JSON.stringify(output)], { type: 'application/json' })
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
  return (attrs.length > 0) ? ` [${attrs.join(',')}]` : ''
}

function quote (value: string): string {
  return '"' + value.replaceAll('"', '\\"') + '"'
}

export class GraphVizBundleDriver extends GraphvizDriver<BundleNode, BundleEdge> {
  private static _instance: GraphVizBundleDriver | null = null
  static get instance (): GraphVizBundleDriver {
    if (this._instance === null) {
      this._instance = new GraphVizBundleDriver()
    }
    return this._instance
  }

  protected addNodeAsString (flags: ContextFlags, id: string, node: BundleNode): string {
    if (node.type === 'bundle') {
      return makeNode(id, { label: 'Bundle\n' + node.bundle.path().name }, {})
    }
    if (node.type === 'field') {
      return makeNode(id, { label: node.field.path().name }, { style: 'filled', fillcolor: 'orange' })
    }
    throw new Error('never reached')
  }

  protected addEdgeAsString (flags: ContextFlags, id: string, from: string, to: string, edge: BundleEdge): string {
    return makeEdge(from, to, {}, {})
  }
}

export class GraphVizModelDriver extends GraphvizDriver<ModelNode, ModelEdge> {
  private static _instance: GraphVizModelDriver | null = null
  static get instance (): GraphVizModelDriver {
    if (this._instance === null) {
      this._instance = new GraphVizModelDriver()
    }
    return this._instance
  }

  protected addNodeAsString ({ ns }: ContextFlags, id: string, node: ModelNode): string {
    if (node.type === 'field') {
      return makeNode(
        id,
        {
          label: node.field.path().name
        },
        {
          shape: 'box',

          style: 'filled',
          fillcolor: 'orange'
        }
      )
    }
    if (node.type === 'class' && node.bundles.size === 0) {
      return makeNode(
        id,
        {
          label: ns.apply(node.clz)
        },
        {}
      )
    }
    if (node.type === 'class' && node.bundles.size > 0) {
      const names = Array.from(node.bundles).map((bundle) => 'Bundle ' + bundle.path().name).join('\n\n')
      const label = ns.apply(node.clz) + '\n\n' + names

      return makeNode(
        id,
        {
          label
        },
        {}
      )
    }
    throw new Error('never reached')
  }

  protected addEdgeAsString ({ ns }: ContextFlags, id: string, from: string, to: string, edge: ModelEdge): string {
    if (edge.type === 'data') {
      return makeEdge(
        from, to,
        {
          label: ns.apply(edge.field.path().datatypeProperty)
        },
        {}
      )
    }
    if (edge.type === 'property') {
      return makeEdge(
        from, to,
        {
          label: ns.apply(edge.property)
        },
        {}
      )
    }
    throw new Error('never reached')
  }
}

// spellchecker:words fillcolor
