import { ContextFlags, defaultLayout, DriverImpl, MountFlags, Size } from '.'
import Sigma from 'sigma'
import Graph from 'graphology'
import { Settings } from 'sigma/dist/declarations/src/settings'
import { BundleEdge, BundleNode } from '../../graph/builders/bundle'
import forceAtlas2 from 'graphology-layout-forceatlas2'
import circular from 'graphology-layout/circular'
import circlepack from 'graphology-layout/circlepack'
import { ModelEdge, ModelNode, modelNodeLabel } from '../../graph/builders/model'

abstract class SigmaDriver<NodeLabel, EdgeLabel> extends DriverImpl<NodeLabel, EdgeLabel, Graph, Sigma> {
  protected abstract addNodeImpl (graph: Graph, flags: ContextFlags, id: string, node: NodeLabel): Promise<undefined>
  protected abstract addEdgeImpl (graph: Graph, flags: ContextFlags, id: string, from: string, to: string, edge: EdgeLabel): Promise<undefined>

  readonly driverName = 'Sigma.js'
  readonly supportedLayouts = [defaultLayout, 'force2atlas', 'circular', 'circlepack']

  protected settings (): Partial<Settings> {
    return {
    }
  }

  protected async newContextImpl (): Promise<Graph> {
    return new Graph()
  }

  protected async finalizeContextImpl (ctx: Graph): Promise<undefined> {
    return undefined
  }

  protected mountImpl (graph: Graph, { container, layout }: MountFlags): Sigma {
    switch (layout === defaultLayout ? 'force2atlas' : layout) {
      case 'force2atlas':
        circular.assign(graph, { scale: 100 })
        forceAtlas2.assign(graph, {
          iterations: 500,
          settings: forceAtlas2.inferSettings(graph)
        })
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
    return new Sigma(graph, container, settings)
  }

  protected resizeMountImpl (sigma: Sigma, graph: Graph, flags: MountFlags, { width, height }: Size): undefined {
    sigma.resize()
    // automatically resized ?
  }

  protected unmountImpl (sigma: Sigma, graph: Graph): void {
    sigma.kill()
  }

  readonly supportedExportFormats = []
  protected async objectToBlobImpl (sigma: Sigma, graph: Graph, flags: MountFlags, format: string): Promise<Blob> {
    return await Promise.reject(new Error('never reached'))
  }
}

export class SigmaBundleDriver extends SigmaDriver<BundleNode, BundleEdge> {
  private static _instance: SigmaBundleDriver | null = null
  static get instance (): SigmaBundleDriver {
    if (this._instance === null) {
      this._instance = new SigmaBundleDriver()
    }
    return this._instance
  }

  protected async addNodeImpl (graph: Graph, { cm }: ContextFlags, id: string, node: BundleNode): Promise<undefined> {
    if (node.type === 'bundle') {
      graph.addNode(id, { label: 'Bundle\n' + node.bundle.path.name, color: cm.get(node.bundle), size: 20 })
      return
    }
    if (node.type === 'field') {
      graph.addNode(id, { label: node.field.path.name, color: cm.get(node.field), size: 10 })
      return
    }
    throw new Error('never reached')
  }

  protected async addEdgeImpl (graph: Graph, flags: ContextFlags, id: string, from: string, to: string, edge: BundleEdge): Promise<undefined> {
    if (edge.type === 'child_bundle') {
      graph.addDirectedEdge(from, to, { color: 'black', type: 'arrow', arrow: 'target', size: 5 })
      return
    }
    if (edge.type === 'field') {
      graph.addDirectedEdge(from, to, { color: 'black', type: 'arrow', arrow: 'target', size: 5 })
      return
    }
    throw new Error('never reached')
  }
}

export class SigmaModelDriver extends SigmaDriver<ModelNode, ModelEdge> {
  private static _instance: SigmaModelDriver | null = null
  static get instance (): SigmaModelDriver {
    if (this._instance === null) {
      this._instance = new SigmaModelDriver()
    }
    return this._instance
  }

  protected async addNodeImpl (graph: Graph, { ns, cm }: ContextFlags, id: string, node: ModelNode): Promise<undefined> {
    const label = modelNodeLabel(node, ns)
    if (node.type === 'field') {
      graph.addNode(id, {
        label,

        color: cm.get(...node.fields),
        size: 10
      })
      return
    }
    if (node.type === 'class' && node.bundles.size === 0) {
      graph.addNode(id, {
        label,

        size: 10
      })
      return
    }
    if (node.type === 'class' && node.bundles.size > 0) {
      graph.addNode(id, {
        label,

        color: cm.get(...node.bundles),
        size: 10
      })
      return
    }
    throw new Error('never reached')
  }

  protected async addEdgeImpl (graph: Graph, { ns }: ContextFlags, id: string, from: string, to: string, edge: ModelEdge): Promise<undefined> {
    if (edge.type === 'data') {
      graph.addDirectedEdge(from, to, { color: 'black', type: 'arrow', arrow: 'target', size: 5 })
      return
    }
    if (edge.type === 'property') {
      graph.addDirectedEdge(from, to, { color: 'black', type: 'arrow', arrow: 'target', size: 5 })
      return
    }
    throw new Error('never reached')
  }
}

// spellchecker:words forceatlas circlepack
