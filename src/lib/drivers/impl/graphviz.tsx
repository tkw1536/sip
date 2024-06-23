import { ContextFlags, defaultLayout, DriverImpl, formatGraphViz, formatSVG, MountFlags, Size } from '.'
import { BundleEdge, BundleNode } from '../../graph/builders/bundle'
import { instance, RenderOptions, Viz, engines } from '@viz-js/viz'
import { ModelEdge, ModelNode, modelNodeLabel } from '../../graph/builders/model'
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
  readonly supportedLayouts = [defaultLayout, ...engines]
  protected options ({ layout, definitelyAcyclic }: MountFlags): RenderOptions {
    const engine = layout === defaultLayout ? (definitelyAcyclic ? 'dot' : 'fdp') : layout
    return { engine }
  }

  protected async newContextImpl (): Promise<Context> {
    return {
      viz: await instance(),
      source: 'digraph { compound=true;'
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

  readonly supportedExportFormats = ['svg', 'gv']
  protected async objectToBlobImpl ({ svg, zoom }: Mount, { source, viz }: Context, flags: MountFlags, format: string): Promise<Blob> {
    switch (format) {
      case 'svg':
      {
        const svg = viz.renderSVGElement(source, this.options(flags))
        return new Blob([outerHTML(svg)], { type: formatSVG })
      }
      case 'gv':
      {
        const output = viz.renderString(source, this.options(flags))
        return new Blob([output], { type: formatGraphViz })
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

function outerHTML (element: Element): string {
  const fakeParent = document.createElement('div')
  fakeParent.appendChild(element)
  return fakeParent.innerHTML
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

  protected addNodeAsString (flags: ContextFlags, id: string, node: ModelNode): string {
    if (node.type === 'field') {
      return this.makeFieldNodes(flags, id, node)
    }
    const label = modelNodeLabel(node, flags.ns)
    if (node.type === 'class' && node.bundles.size === 0) {
      return makeNode(
        id,
        {
          label
        },
        {}
      )
    }
    if (node.type === 'class' && node.bundles.size > 0) {
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

  private makeFieldNodes ({ ns }: ContextFlags, id: string, { fields }: ModelNode & { type: 'field' }): string {
    let output = `subgraph ${quote('cluster-' + id)}{\n`

    output += makeNode(
      id,
      { label: 'Literal' },
      { shape: 'box' }
    ) + '\n'

    Array.from(fields).forEach((field, idx) => {
      const fieldID = `${id}-${idx}`
      const node = makeNode(
        fieldID,
        {
          label: field.path().name
        },
        {
          style: 'filled',
          fillcolor: 'orange'
        }
      )
      output += node + '\n'
      output += makeEdge(id, fieldID, { label: field.path().informativeFieldType }, {}) + '\n'
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

// spellchecker:words fillcolor lhead
