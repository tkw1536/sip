import {
  type ContextFlags,
  DriverImpl,
  ErrorUnsupported,
  type MountFlags,
  type Size,
  defaultLayout,
} from '.'
import Sigma from 'sigma'
import Graph from 'graphology'
import { type Settings } from 'sigma/dist/declarations/src/settings'
import {
  type BundleOptions,
  type BundleEdge,
  type BundleNode,
} from '../../graph/builders/bundle'
import FA2Layout from 'graphology-layout-forceatlas2/worker'
import { inferSettings } from 'graphology-layout-forceatlas2'
import circular from 'graphology-layout/circular'
import circlepack from 'graphology-layout/circlepack'
import {
  type ModelOptions,
  type ModelEdge,
  type ModelNode,
  LiteralModelNode,
  ConceptModelNode,
  type Element,
} from '../../graph/builders/model/types'
import { type Attributes } from 'graphology-types'

interface SigmaMount {
  beforeStop?: () => void
  sigma: Sigma
}

abstract class SigmaDriver<NodeLabel, EdgeLabel, Options> extends DriverImpl<
  NodeLabel,
  EdgeLabel,
  Options,
  Graph,
  SigmaMount
> {
  protected abstract addNodeImpl(
    graph: Graph,
    flags: ContextFlags<Options>,
    id: string,
    node: NodeLabel,
  ): Promise<undefined>
  protected abstract addEdgeImpl(
    graph: Graph,
    flags: ContextFlags<Options>,
    id: string,
    from: string,
    to: string,
    edge: EdgeLabel,
  ): Promise<undefined>

  readonly driverName = 'Sigma.js'
  readonly supportedLayouts = [
    defaultLayout,
    'force2atlas',
    'circular',
    'circlepack',
  ]

  protected settings(): Partial<Settings> {
    return {
      renderEdgeLabels: true,
    }
  }

  protected async newContextImpl(): Promise<Graph> {
    return new Graph()
  }

  protected async finalizeContextImpl(ctx: Graph): Promise<Graph> {
    return ctx
  }

  protected mountImpl(
    graph: Graph,
    { container, layout }: MountFlags<Options>,
  ): SigmaMount {
    let onStop: (() => void) | undefined
    switch (layout === defaultLayout ? 'force2atlas' : layout) {
      case 'force2atlas':
        {
          circular.assign(graph, { scale: 100 })
          const layout = new FA2Layout(graph, {
            settings: inferSettings(graph),
          })
          layout.start()
          onStop = layout.kill.bind(layout)
        }

        break
      case 'circlepack':
        circlepack.assign(graph)
        break
      case 'circular': /* fallthrough */
      default:
        circular.assign(graph, { scale: 100 })
    }
    // setup an initial layout

    const settings = this.settings()
    return {
      sigma: new Sigma(graph, container, settings),
      beforeStop: onStop,
    }
  }

  protected resizeMountImpl(
    sigma: SigmaMount,
    graph: Graph,
    flags: MountFlags<Options>,
    { width, height }: Size,
  ): undefined {
    sigma.sigma.resize()
  }

  protected unmountImpl(sigma: SigmaMount, graph: Graph): void {
    sigma.sigma.kill()
    if (typeof sigma.beforeStop === 'function') {
      sigma.beforeStop()
    }
  }

  readonly supportedExportFormats = []
  protected async exportImpl(
    graph: Graph,
    flags: ContextFlags<Options>,
    format: string,
    mount?: { mount: SigmaMount; flags: MountFlags<Options> },
  ): Promise<Blob> {
    throw ErrorUnsupported
  }
}

export class SigmaBundleDriver extends SigmaDriver<
  BundleNode,
  BundleEdge,
  BundleOptions
> {
  protected async addNodeImpl(
    graph: Graph,
    { options: { cm } }: ContextFlags<BundleOptions>,
    id: string,
    node: BundleNode,
  ): Promise<undefined> {
    if (node.type === 'bundle') {
      graph.addNode(id, {
        label: 'Bundle\n' + node.bundle.path.name,
        color: cm.getDefault(node.bundle),
        size: 20,
      })
      return
    }
    if (node.type === 'field') {
      graph.addNode(id, {
        label: node.field.path.name,
        color: cm.getDefault(node.field),
        size: 10,
      })
      return
    }
    throw new Error('never reached')
  }

  protected async addEdgeImpl(
    graph: Graph,
    flags: ContextFlags<BundleOptions>,
    id: string,
    from: string,
    to: string,
    edge: BundleEdge,
  ): Promise<undefined> {
    if (edge.type === 'child_bundle') {
      graph.addDirectedEdge(from, to, {
        color: 'black',
        type: 'arrow',
        arrow: 'target',
        size: 5,
      })
      return
    }
    if (edge.type === 'field') {
      graph.addDirectedEdge(from, to, {
        color: 'black',
        type: 'arrow',
        arrow: 'target',
        size: 5,
      })
      return
    }
    throw new Error('never reached')
  }
}

export class SigmaModelDriver extends SigmaDriver<
  ModelNode,
  ModelEdge,
  ModelOptions
> {
  static readonly #defaultColor = 'black'
  protected async addNodeImpl(
    graph: Graph,
    { options }: ContextFlags<ModelOptions>,
    id: string,
    node: ModelNode,
  ): Promise<undefined> {
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

    graph.addNode(element.id, SigmaModelDriver.#nodeData(element, { size: 10 }))

    if (typeof element.attached === 'undefined') {
      return
    }

    element.attached.fields.forEach(({ node, edge }) => {
      graph.addNode(node.id, SigmaModelDriver.#nodeData(node, { size: 10 }))
      graph.addDirectedEdge(
        element.id,
        node.id,
        SigmaModelDriver.#edgeData(edge, { size: 5 }),
      )
    })
  }

  #addConceptNode(
    graph: Graph,
    options: ModelOptions,
    id: string,
    node: ConceptModelNode,
  ): void {
    const element = node.render(id, options)

    graph.addNode(element.id, SigmaModelDriver.#nodeData(element, { size: 10 }))

    if (typeof element.attached === 'undefined') {
      return
    }

    element.attached.fields.forEach(({ node, edge }) => {
      graph.addNode(node.id, SigmaModelDriver.#nodeData(node, { size: 10 }))
      graph.addDirectedEdge(
        element.id,
        node.id,
        SigmaModelDriver.#edgeData(edge, { size: 5 }),
      )
    })

    element.attached.bundles.forEach(({ node, edge }) => {
      graph.addNode(node.id, SigmaModelDriver.#nodeData(node, { size: 10 }))
      graph.addDirectedEdge(
        element.id,
        node.id,
        SigmaModelDriver.#edgeData(edge, { size: 5 }),
      )
    })
  }

  protected async addEdgeImpl(
    graph: Graph,
    { options }: ContextFlags<ModelOptions>,
    id: string,
    from: string,
    to: string,
    edge: ModelEdge,
  ): Promise<undefined> {
    const element = edge.render(id, options)

    graph.addDirectedEdge(
      from,
      to,
      SigmaModelDriver.#edgeData(element, { size: 5 }),
    )
  }

  static readonly #defaultEdgeColor = 'black'
  static readonly #defaultNodeColor = 'black'

  static #nodeData(element: Element, extra?: Attributes): Attributes {
    return {
      color: element.color ?? this.#defaultNodeColor,
      label: element.label ?? undefined,

      ...(extra ?? {}),
    }
  }

  static #edgeData(element: Element, extra?: Attributes): Attributes {
    return {
      color: element.color ?? this.#defaultEdgeColor,
      label: element.label ?? undefined,

      type: 'arrow',
      arrow: 'target',

      ...(extra ?? {}),
    }
  }
}

// spellchecker:words forceatlas circlepack
