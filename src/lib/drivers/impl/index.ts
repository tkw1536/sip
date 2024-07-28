import { type Size } from '../../../components/hooks/observer'
import type Graph from '../../graph'
import {
  type Attachment,
  type Element,
  type ElementWithAttachments,
  type Renderable,
} from '../../graph/builders'
import { IDPool } from '../../utils/id-pool'

export const defaultLayout = 'auto'

export type ContextFlags<Options> = Readonly<{
  options: Options
  layout: string
  seed: number | null
}>

export type DriverClass<
  NodeLabel extends Renderable<Options, AttachmentKey>,
  EdgeLabel extends Renderable<Options, AttachmentKey>,
  Options,
  AttachmentKey extends string,
> = new (
  graph: Graph<NodeLabel, EdgeLabel>,
  flags: ContextFlags<Options>,
) => Driver<NodeLabel, EdgeLabel, Options, AttachmentKey>

export interface Refs {
  /** indicates if the driver is currently animating a simulation */
  animating: (animating: boolean | null) => void
}

/** driver renders a single instance on a page */
export default interface Driver<
  NodeLabel extends Renderable<Options, AttachmentKey>,
  EdgeLabel extends Renderable<Options, AttachmentKey>,
  Options,
  AttachmentKey extends string,
> {
  graph: Graph<NodeLabel, EdgeLabel>
  flags: ContextFlags<Options>

  readonly driverName: string

  /** gets the seed used by this driver, or null if not available */
  readonly seed: number | null

  /**
   * Creates and initializes this instance of the driver for the given graph.
   * It should perform potentially expensive computations in the background (e.g. using a webworker).
   *
   * Afterwards this instance may or may not be {@link mount}ed onto the page.
   * For this reason initialize should automatically remove any background jobs.
   *
   * @param flags Flags for the context to create
   * @param ticket Used for cancellation. Returns false if the result is known to be discarded. In this case makeContext may chose to throw {@link ErrorAborted}.
   */
  initialize: (ticket: () => boolean) => Promise<void>

  /** list of supported layouts to be passed to initialize */
  readonly layouts: string[]

  /** mounts this instance onto the page */
  mount: (element: HTMLElement, refs: Refs) => void

  /** resizes this instance which is already {@link mount}ed onto the page */
  resize: (size: Size) => void

  /** unmounts the {@link mount}ed instance from the page */
  unmount: () => void

  startAnimation: () => void
  stopAnimation: () => void

  /** list of formats allowed as an argument to {@link export} */
  readonly exportFormats: string[]

  /**
   * Exports the rendered image into a blob.
   *
   * Export may be run in a browser context or a non-browser context.
   * @param ctx Context returned from {@link initialize} to be rendered into a blob
   * @param flags Flags used to create the context
   * @param format Format to be exported in. One of {@link exportFormats}.
   * @param mount Options used for mounting on the page.
   */
  export: (format: string) => Promise<Blob>
}

/** indicates to the caller that the driver has aborted it's current operation */
export const ErrorAborted = new Error('Driver: aborted')

/** thrown if an operation is not supported */
export const ErrorUnsupported = new Error('Driver: Not supported')

/** ContextDetails holds information about an initialized {@link DriverImpl} */
export interface ContextDetails<Context, Options> {
  context: Context
  flags: ContextFlags<Options>
  seed: number
}

/** MountInfo holds information about a mounted DriverImpl */
export interface MountInfo<Mount> {
  /** the mount object */
  mount: Mount

  /** the element this instance is mounted to */
  element: HTMLElement

  /** refs set by this driver */
  refs: Refs

  /** the current size of this mount (if known) */
  size?: Size
}

/** implements a driver */
export abstract class DriverImpl<
  NodeLabel extends Renderable<Options, AttachmentKey>,
  EdgeLabel extends Renderable<Options, AttachmentKey>,
  Options,
  AttachmentKey extends string,
  NodeAttrs,
  EdgeAttrs,
  Cluster,
  Context,
  Mount,
  HotContext = Context,
> implements Driver<NodeLabel, EdgeLabel, Options, AttachmentKey>
{
  flags: ContextFlags<Options>
  constructor(
    public readonly graph: Graph<NodeLabel, EdgeLabel>,
    flags: ContextFlags<Options>,
  ) {
    this.flags = Object.freeze(flags)

    this.seed =
      this.flags.seed ?? Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)

    const ids = new IDPool()

    let hot: HotContext = this.newContextImpl(this.flags, this.seed)

    // add all nodes and edges
    for (const [id, node] of this.graph.getNodes()) {
      const nodeID = ids.for(id)
      const element = node.render(nodeID, this.flags.options)
      hot = this.addNodeImpl(hot, this.flags, nodeID, node, element) ?? hot
    }
    for (const [id, from, to, edge] of this.graph.getEdges()) {
      const edgeID = ids.for(id)
      const element = edge.render(edgeID, this.flags.options)
      hot =
        this.addEdgeImpl(
          hot,
          this.flags,
          ids.for(id),
          ids.for(from),
          ids.for(to),
          edge,
          element,
        ) ?? hot
    }
    this.#hot = hot
  }

  abstract readonly driverName: string

  readonly #hot: HotContext
  readonly seed: number
  #context: ContextDetails<Context, Options> | null = null
  #mount: MountInfo<Mount> | null = null

  async initialize(ticket: () => boolean): Promise<void> {
    if (this.#hot === null) {
      throw new Error('Driver error: initialize called out of order')
    }
    // finalize the context
    const ctx = await this.initializeImpl(this.#hot, this.flags, this.seed)
    if (!ticket()) throw ErrorAborted

    // get the seed of this mount (if any)
    this.#context = { context: ctx, flags: this.flags, seed: this.seed }
  }

  protected abstract newContextImpl(
    flags: ContextFlags<Options>,
    seed: number,
  ): HotContext

  protected abstract initializeImpl(
    ctx: HotContext,
    flags: ContextFlags<Options>,
    seed: number,
  ): Promise<Context>

  abstract readonly layouts: string[]

  mount(element: HTMLElement, refs: Refs): void {
    if (this.#context === null || this.#mount !== null) {
      throw new Error('Driver error: mount called out of order')
    }

    this.#mount = {
      mount: this.mountImpl(this.#context, element, refs),
      element,
      refs,
    }
  }
  protected abstract mountImpl(
    details: ContextDetails<Context, Options>,
    element: HTMLElement,
    refs: Refs,
  ): Mount

  resize(size: Size): void {
    if (this.#context === null || this.#mount === null) {
      throw new Error('Driver error: resize called out of order')
    }

    const { mount, element, refs } = this.#mount
    this.#mount = {
      mount: this.resizeMountImpl(this.#context, this.#mount, size) ?? mount,
      element,
      refs,
      size,
    }
  }
  protected abstract resizeMountImpl(
    details: ContextDetails<Context, Options>,
    info: MountInfo<Mount> | null,
    size: Size,
  ): Mount | void

  unmount(): void {
    if (this.#context === null || this.#mount === null) {
      throw new Error('Driver error: unmount called out of order')
    }

    this.unmountImpl(this.#context, this.#mount)
    this.#mount = null
  }
  protected abstract unmountImpl(
    details: ContextDetails<Context, Options>,
    info: MountInfo<Mount> | null,
  ): void

  abstract readonly exportFormats: string[]

  async export(format: string): Promise<Blob> {
    if (this.#context === null) {
      throw new Error('Driver error: export called out of order')
    }

    return await this.exportImpl(this.#context, this.#mount, format)
  }
  protected abstract exportImpl(
    details: ContextDetails<Context, Options>,
    info: MountInfo<Mount> | null,
    format: string,
  ): Promise<Blob>

  startAnimation = (): void => {
    if (this.#context === null || this.#mount === null) {
      throw new Error('Driver error: startSimulation called out of order')
    }

    this.startSimulationImpl(this.#context, this.#mount)
  }
  protected abstract startSimulationImpl(
    details: ContextDetails<Context, Options>,
    info: MountInfo<Mount> | null,
  ): void

  stopAnimation = (): void => {
    if (this.#context === null || this.#mount === null) {
      throw new Error('Driver error: startSimulation called out of order')
    }

    this.stopSimulationImpl(this.#context, this.#mount)
  }

  protected abstract stopSimulationImpl(
    details: ContextDetails<Context, Options>,
    info: MountInfo<Mount> | null,
  ): void

  /** creates a new cluster */
  protected abstract createCluster(context: HotContext, id: string): Cluster

  /** creates a new cluster with the given id */
  protected abstract placeCluster(
    context: HotContext,
    id: string,
    cluster: Cluster,
  ): HotContext | void

  /** places the node into the context */
  protected abstract placeNode(
    context: HotContext,
    id: string,
    attributes: NodeAttrs,
    cluster?: Cluster,
  ): HotContext | void

  /** places the edge into the context */
  protected abstract placeEdge(
    context: HotContext,
    id: string,
    from: string,
    to: string,
    attributes: EdgeAttrs,
    cluster?: Cluster,
  ): HotContext | void

  /** get the attributes for a node */
  protected abstract attributes(type: 'node', element: Element): NodeAttrs

  /** get the attributes for an edge */
  protected abstract attributes(type: 'edge', element: Element): EdgeAttrs

  protected addNodeImpl(
    context: HotContext,
    flags: ContextFlags<Options>,
    id: string,
    node: NodeLabel,
    element: ElementWithAttachments<AttachmentKey>,
  ): HotContext | void {
    const { attached } = element

    // no attachments => place a simple node
    if (typeof attached === 'undefined') {
      return this.placeNode(
        context,
        element.id,
        this.renderSimpleNode(node, element),
      )
    }

    let hot = context

    // complex node => create a cluster
    const clusterID = `${element.id}-cluster`
    const cluster = this.createCluster(hot, clusterID)

    // add the node itself
    hot =
      this.placeNode(
        hot,
        element.id,
        this.renderComplexNode(node, element),
        cluster,
      ) ?? hot

    // add all the attachments
    Object.entries(attached).forEach(([attachment, sElements]) => {
      ;(sElements as Attachment[]).forEach(({ node: aNode, edge: aEdge }) => {
        hot =
          this.placeNode(
            hot,
            aNode.id,
            this.renderAttachedNode(node, attachment as AttachmentKey, aNode),
            cluster,
          ) ?? hot

        hot =
          this.placeEdge(
            hot,
            aEdge.id,
            aNode.id,
            element.id,
            this.renderAttachedEdge(node, attachment as AttachmentKey, aEdge),
            cluster,
          ) ?? hot
      })
    })

    return this.placeCluster(hot, clusterID, cluster)
  }

  protected addEdgeImpl(
    context: HotContext,
    flags: ContextFlags<Options>,
    id: string,
    from: string,
    to: string,
    edge: EdgeLabel,
    element: ElementWithAttachments<AttachmentKey>,
  ): HotContext | void {
    return this.placeEdge(context, id, from, to, this.renderEdge(edge, element))
  }

  protected renderSimpleNode(
    node: NodeLabel,
    element: ElementWithAttachments<AttachmentKey>,
  ): NodeAttrs {
    return this.renderAnyNode(node, element)
  }

  protected renderComplexNode(
    node: NodeLabel,
    element: ElementWithAttachments<AttachmentKey>,
  ): NodeAttrs {
    return this.renderAnyNode(node, element)
  }

  protected renderAttachedNode(
    parent: NodeLabel,
    attachment: AttachmentKey,
    element: Element,
  ): NodeAttrs {
    return this.renderAnyNode(parent, element)
  }

  protected renderAnyNode(
    node: NodeLabel,
    element: ElementWithAttachments<AttachmentKey>,
  ): NodeAttrs {
    return this.attributes('node', element)
  }

  protected renderAttachedEdge(
    parent: NodeLabel,
    attachment: AttachmentKey,
    element: Element,
  ): EdgeAttrs {
    return this.attributes('edge', element)
  }

  protected renderEdge(
    edge: EdgeLabel,
    element: ElementWithAttachments<AttachmentKey>,
  ): EdgeAttrs {
    return this.attributes('edge', element)
  }
}
