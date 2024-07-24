import {
  type ContextDetails,
  DriverImpl,
  ErrorUnsupported,
  type MountInfo,
  type Refs,
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

interface SigmaMount {
  stopLayout?: () => void
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
  readonly driverName = 'Sigma.js'
  readonly layouts = [defaultLayout, 'force2atlas', 'circular', 'circlepack']

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
    { context: graph, flags: { layout }, seed }: ContextDetails<Graph, Options>,
    element: HTMLElement,
    refs: Refs,
  ): SigmaMount {
    let stopLayout: (() => void) | undefined
    switch (layout === defaultLayout ? 'force2atlas' : layout) {
      case 'force2atlas':
        {
          circular.assign(graph, { scale: 100 })
          const layout = new FA2Layout(graph, {
            settings: inferSettings(graph),
          })

          layout.start()

          // poll if the layout is still animating
          refs.animating(true)
          const interval = setInterval(() => {
            if (layout.isRunning()) {
              return
            }

            clearInterval(interval)
            refs.animating(null)
          }, 500)

          stopLayout = () => {
            // notify that we're no longer animating
            clearInterval(interval)
            refs.animating(null)

            layout.kill()
          }
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

    const settings = this.settings()
    return {
      sigma: new Sigma(graph, element, settings),
      stopLayout,
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
    { mount: sigma }: MountInfo<SigmaMount>,
  ): void {
    sigma.sigma.kill()
    if (typeof sigma.stopLayout === 'function') {
      sigma.stopLayout()
    }
  }

  readonly exportFormats = []
  protected async exportImpl(
    details: ContextDetails<Graph, Options>,
    info: MountInfo<SigmaMount> | null,
    format: string,
  ): Promise<Blob> {
    throw ErrorUnsupported
  }

  protected getSeedImpl(
    details: ContextDetails<Graph, Options>,
    info: MountInfo<SigmaMount> | null,
  ): number | null {
    return details.seed
  }

  protected startSimulationImpl(
    details: ContextDetails<Graph, Options>,
    info: MountInfo<SigmaMount>,
  ): void {}

  protected stopSimulationImpl(
    details: ContextDetails<Graph, Options>,
    info: MountInfo<SigmaMount>,
  ): void {
    const { stopLayout } = info.mount
    if (typeof stopLayout === 'function') {
      stopLayout()
    }
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
}

export class SigmaBundleDriver extends SigmaDriver<
  BundleNode,
  BundleEdge,
  BundleOptions,
  never
> {}

export class SigmaModelDriver extends SigmaDriver<
  ModelNode,
  ModelEdge,
  ModelOptions,
  ModelAttachmentKey
> {}

export class SigmaRDFDriver extends SigmaDriver<
  RDFNode,
  RDFEdge,
  RDFOptions,
  never
> {}

// spellchecker:words forceatlas circlepack
