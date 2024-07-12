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
import { type BundleEdge, type BundleNode } from '../../graph/builders/bundle'
import FA2Layout from 'graphology-layout-forceatlas2/worker'
import { inferSettings } from 'graphology-layout-forceatlas2'
import circular from 'graphology-layout/circular'
import circlepack from 'graphology-layout/circlepack'
import {
  type ModelEdge,
  type ModelNode,
  modelNodeLabel,
} from '../../graph/builders/model'

interface SigmaMount {
  beforeStop?: () => void
  sigma: Sigma
}

abstract class SigmaDriver<NodeLabel, EdgeLabel> extends DriverImpl<
  NodeLabel,
  EdgeLabel,
  Graph,
  SigmaMount
> {
  protected abstract addNodeImpl(
    graph: Graph,
    flags: ContextFlags,
    id: string,
    node: NodeLabel,
  ): Promise<undefined>
  protected abstract addEdgeImpl(
    graph: Graph,
    flags: ContextFlags,
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
    return {}
  }

  protected async newContextImpl(): Promise<Graph> {
    return new Graph()
  }

  protected async finalizeContextImpl(ctx: Graph): Promise<Graph> {
    return ctx
  }

  protected mountImpl(
    graph: Graph,
    { container, layout }: MountFlags,
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
    flags: MountFlags,
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
    flags: ContextFlags,
    format: string,
    mount?: { mount: SigmaMount; flags: MountFlags },
  ): Promise<Blob> {
    throw ErrorUnsupported
  }
}

export class SigmaBundleDriver extends SigmaDriver<BundleNode, BundleEdge> {
  protected async addNodeImpl(
    graph: Graph,
    { cm }: ContextFlags,
    id: string,
    node: BundleNode,
  ): Promise<undefined> {
    if (node.type === 'bundle') {
      graph.addNode(id, {
        label: 'Bundle\n' + node.bundle.path.name,
        color: cm.get(node.bundle),
        size: 20,
      })
      return
    }
    if (node.type === 'field') {
      graph.addNode(id, {
        label: node.field.path.name,
        color: cm.get(node.field),
        size: 10,
      })
      return
    }
    throw new Error('never reached')
  }

  protected async addEdgeImpl(
    graph: Graph,
    flags: ContextFlags,
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

export class SigmaModelDriver extends SigmaDriver<ModelNode, ModelEdge> {
  protected async addNodeImpl(
    graph: Graph,
    { ns, cm }: ContextFlags,
    id: string,
    node: ModelNode,
  ): Promise<undefined> {
    const label = modelNodeLabel(node, ns)
    if (node.type === 'field') {
      graph.addNode(id, {
        label,

        color: cm.get(...node.fields),
        size: 10,
      })
      return
    }
    if (node.type === 'class' && node.bundles.size === 0) {
      graph.addNode(id, {
        label,

        size: 10,
      })
      return
    }
    if (node.type === 'class' && node.bundles.size > 0) {
      graph.addNode(id, {
        label,

        color: cm.get(...node.bundles),
        size: 10,
      })
      return
    }
    throw new Error('never reached')
  }

  protected async addEdgeImpl(
    graph: Graph,
    { ns }: ContextFlags,
    id: string,
    from: string,
    to: string,
    edge: ModelEdge,
  ): Promise<undefined> {
    if (edge.type === 'data') {
      graph.addDirectedEdge(from, to, {
        color: 'black',
        type: 'arrow',
        arrow: 'target',
        size: 5,
      })
      return
    }
    if (edge.type === 'property') {
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

// spellchecker:words forceatlas circlepack