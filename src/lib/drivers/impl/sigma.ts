import {
  type ContextDetails,
  DriverImpl,
  ErrorUnsupported,
  type MountInfo,
  type Refs,
  type Snapshot,
  type View,
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
  type ModelAttachmentKey,
} from '../../graph/builders/model/labels'
import { type Attributes } from 'graphology-types'
import { prng } from '../../utils/prng'
import { type Element, type Renderable } from '../../graph/builders'
import {
  type RDFEdge,
  type RDFNode,
  type RDFOptions,
} from '../../graph/builders/rdf'
import { type Size } from '../../../components/hooks/observer'

interface SigmaMount {
  layout?: SigmaLayout
  sigma: Sigma
}

abstract class SigmaDriver<
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
  null,
  Graph,
  SigmaMount
> {
  static readonly id = 'Sigma.js'
  static readonly layouts = [
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

  protected newContextImpl(): Graph {
    return new Graph()
  }

  protected async initializeImpl(ctx: Graph): Promise<Graph> {
    return ctx
  }

  protected mountImpl(
    { context: graph, flags: { layout }, seed }: ContextDetails<Graph, Options>,
    element: HTMLElement,
    refs: Refs,
  ): SigmaMount {
    let sigmaLayout: SigmaLayout | undefined
    switch (layout === defaultLayout ? 'force2atlas' : layout) {
      case 'force2atlas':
        {
          circular.assign(graph, { scale: 100 })
          const layout = new FA2Layout(graph, {
            settings: inferSettings(graph),
          })

          sigmaLayout = new SigmaLayout(layout, refs.animating)
        }

        break
      case 'circlepack':
        circlepack.assign(graph, { rng: prng(seed) })
        break
      case 'circular': /* fallthrough */
      default:
        circular.assign(graph, { scale: 100 })
    }
    // setup an initial layout

    // start the layout if we have it!
    if (typeof sigmaLayout !== 'undefined') {
      sigmaLayout.start()
    }

    const settings = this.settings()
    return {
      sigma: new Sigma(graph, element, settings),
      layout: sigmaLayout,
    }
  }

  protected resizeMountImpl(
    details: ContextDetails<Graph, Options>,
    info: MountInfo<SigmaMount>,
    size: Size,
  ): void {
    /* automatically resized */
  }

  protected unmountImpl(
    details: ContextDetails<Graph, Options>,
    { mount: { sigma, layout } }: MountInfo<SigmaMount>,
  ): void {
    if (typeof layout !== 'undefined') {
      layout.kill()
    }
    sigma.kill()
  }

  static readonly formats = []
  protected async exportImpl(
    details: ContextDetails<Graph, Options>,
    info: MountInfo<SigmaMount> | null,
    format: string,
  ): Promise<Blob> {
    throw ErrorUnsupported
  }

  protected startSimulationImpl(
    details: ContextDetails<Graph, Options>,
    { mount: { layout } }: MountInfo<SigmaMount>,
  ): void {
    layout?.start()
  }

  protected stopSimulationImpl(
    details: ContextDetails<Graph, Options>,
    { mount: { layout } }: MountInfo<SigmaMount>,
  ): void {
    layout?.stop()
  }

  protected createCluster(
    context: Graph<Attributes, Attributes, Attributes>,
    id: string,
  ): null {
    return null
  }

  protected placeCluster(
    context: Graph<Attributes, Attributes, Attributes>,
    id: string,
    cluster: null,
  ): Graph<Attributes, Attributes, Attributes> | void {}

  protected placeNode(
    graph: Graph<Attributes, Attributes, Attributes>,
    id: string,
    attributes: Attributes,
    cluster?: null | undefined,
  ): Graph<Attributes, Attributes, Attributes> | void {
    graph.addNode(id, attributes)
  }

  protected placeEdge(
    graph: Graph<Attributes, Attributes, Attributes>,
    id: string,
    from: string,
    to: string,
    attributes: Attributes,
    cluster?: null | undefined,
  ): void {
    graph.addDirectedEdge(from, to, attributes)
  }

  protected attributes(
    type: 'node' | 'edge',
    { color, label, tooltip }: Element,
  ): Attributes {
    return {
      label: label ?? undefined,
      color: color ?? 'black',

      type: type === 'edge' ? 'arrow' : undefined,
      arrow: type === 'edge' ? 'target' : undefined,
      size: type === 'node' ? 10 : 5,
    }
  }

  protected getPositionsImpl(
    {
      context: graph,
    }: ContextDetails<Graph<Attributes, Attributes, Attributes>, Options>,
    { mount: { sigma } }: MountInfo<SigmaMount>,
  ): Snapshot['positions'] | null {
    const positions: Snapshot['positions'] = {}
    graph.nodes().forEach(node => {
      const display = sigma.getNodeDisplayData(node)
      if (typeof display === 'undefined') return display
      positions[node] = { x: display.x, y: display.y }
    })
    return positions
  }

  protected readonly skipRestoreAnimating = true
  protected setPositionsImpl(
    {
      context: graph,
    }: ContextDetails<Graph<Attributes, Attributes, Attributes>, Options>,
    { mount: { sigma } }: MountInfo<SigmaMount>,
    positions: Snapshot['positions'],
  ): SigmaMount | void {
    Object.entries(positions).forEach(([node, { x, y }]) => {
      if (!graph.hasNode(node)) return
      graph.setNodeAttribute(node, 'x', x)
      graph.setNodeAttribute(node, 'y', y)
    })
    sigma.refresh()
  }

  protected getViewImpl(
    details: ContextDetails<Graph<Attributes, Attributes, Attributes>, Options>,
    { mount: { sigma } }: MountInfo<SigmaMount>,
  ): View {
    const camera = sigma.getCamera().getState()
    return {
      zoom: camera.ratio,
      center: { x: camera.x, y: camera.y },
    }
  }
  protected setViewImpl(
    details: ContextDetails<Graph<Attributes, Attributes, Attributes>, Options>,
    { mount: { sigma } }: MountInfo<SigmaMount>,
    view: View,
  ): void {
    sigma
      .getCamera()
      .setState({ x: view.center.x, y: view.center.y, ratio: view.zoom })
  }
}

class SigmaLayout {
  #layout: LayoutLike | null
  #animating: ((value: boolean | null) => void) | null
  constructor(
    layout: LayoutLike,
    animatingRef: (value: boolean | null) => void,
  ) {
    this.#layout = layout
    this.#animating = animatingRef
  }

  #poller: NodeJS.Timeout | null = null
  #running: boolean = false
  start = (): void => {
    if (this.#running || this.#layout === null) return
    this.#running = true
    if (this.#animating !== null) {
      this.#animating(true)
    }
    this.#layout.start()
    this.#startPolling()
  }
  stop = (): void => {
    if (!this.#running || this.#layout === null) return
    this.#stopPolling()
    this.#running = false
    if (this.#animating !== null) {
      this.#animating(false)
    }
    this.#layout.stop()
  }
  kill = (): void => {
    this.#running = false
    this.#stopPolling()

    if (this.#animating !== null) {
      this.#animating(null)
      this.#animating = null
    }

    if (this.#layout !== null) {
      this.#layout.kill()
      this.#layout = null
    }
  }

  #startPolling(): void {
    this.#stopPolling()

    this.#poller = setInterval(() => {
      if (this.#layout === null || !this.#layout.isRunning()) {
        this.stop()
      }
    }, 500)
  }
  #stopPolling(): void {
    if (this.#poller !== null) {
      clearInterval(this.#poller)
      this.#poller = null
    }
  }
}

interface LayoutLike {
  isRunning: () => boolean
  start: () => void
  stop: () => void
  kill: () => void
}

export class SigmaBundleDriver extends SigmaDriver<
  BundleNode,
  BundleEdge,
  BundleOptions,
  never
> {
  readonly driver = SigmaBundleDriver
}

export class SigmaModelDriver extends SigmaDriver<
  ModelNode,
  ModelEdge,
  ModelOptions,
  ModelAttachmentKey
> {
  readonly driver = SigmaModelDriver
}

export class SigmaRDFDriver extends SigmaDriver<
  RDFNode,
  RDFEdge,
  RDFOptions,
  never
> {
  readonly driver = SigmaRDFDriver
}

// spellchecker:words forceatlas circlepack
