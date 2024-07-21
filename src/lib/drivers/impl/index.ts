import type Graph from '../../graph'
import { IDPool } from '../../utils/id-pool'

export const defaultLayout = 'auto'

export interface Size {
  width: number
  height: number
}

export type ContextFlags<Options> = Readonly<{
  options: Options
  layout: string
  definitelyAcyclic: boolean
  size: Size
  seed: number | null
}>

export type DriverClass<NodeLabel, EdgeLabel, Options> = new () => Driver<
  NodeLabel,
  EdgeLabel,
  Options
>

/** driver renders a single instance on a page */
export default interface Driver<NodeLabel, EdgeLabel, Options> {
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
   * @param graph The graph to be rendered
   * @param ticket Used for cancellation. Returns false if the result is known to be discarded. In this case makeContext may chose to throw {@link ErrorAborted}.
   */
  initialize: (
    graph: Graph<NodeLabel, EdgeLabel>,
    flags: ContextFlags<Options>,
    ticket: () => boolean,
  ) => Promise<void>

  /** list of supported layouts to be passed to initialize */
  readonly layouts: string[]

  /** mounts this instance onto the page */
  mount: (element: HTMLElement) => void

  /** resizes this instance which is already {@link mount}ed onto the page */
  resize: (size: Size) => void

  /** unmounts the {@link mount}ed instance from the page */
  unmount: () => void

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

  /** the current size of this mount */
  size: Size
}

/** implements a driver */
export abstract class DriverImpl<
  NodeLabel,
  EdgeLabel,
  Options,
  Context,
  Mount,
  HotContext = Context,
> implements Driver<NodeLabel, EdgeLabel, Options>
{
  abstract readonly driverName: string

  #context: ContextDetails<Context, Options> | null = null
  #mount: MountInfo<Mount> | null = null

  async initialize(
    graph: Graph<NodeLabel, EdgeLabel>,
    flags: ContextFlags<Options>,
    ticket: () => boolean,
  ): Promise<void> {
    if (this.#context !== null || this.#mount !== null) {
      throw new Error('Driver error: initialize called out of order')
    }

    const seed =
      flags.seed ?? Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)

    const ids = new IDPool()
    if (!ticket()) throw ErrorAborted

    let hCtx = await this.newContextImpl(flags, seed)
    if (!ticket()) throw ErrorAborted

    // add all nodes and edges
    for (const [id, node] of graph.getNodes()) {
      hCtx = (await this.addNodeImpl(hCtx, flags, ids.for(id), node)) ?? hCtx
      if (!ticket()) throw ErrorAborted
    }
    for (const [id, from, to, edge] of graph.getEdges()) {
      hCtx =
        (await this.addEdgeImpl(
          hCtx,
          flags,
          ids.for(id),
          ids.for(from),
          ids.for(to),
          edge,
        )) ?? hCtx
      if (!ticket()) throw ErrorAborted
    }

    // finalize the context
    const ctx = await this.finalizeContextImpl(hCtx, flags, seed)
    if (!ticket()) throw ErrorAborted

    // get the seed of this mount (if any)
    this.#context = { context: ctx, flags, seed }
    this.#seed = this.getSeedImpl(this.#context, null) ?? flags.seed
  }
  protected abstract newContextImpl(
    flags: ContextFlags<Options>,
    seed: number,
  ): Promise<HotContext>

  protected abstract addNodeImpl(
    ctx: HotContext,
    flags: ContextFlags<Options>,
    id: string,
    node: NodeLabel,
  ): Promise<HotContext | null | undefined> | null | undefined

  protected abstract addEdgeImpl(
    ctx: HotContext,
    flags: ContextFlags<Options>,
    id: string,
    from: string,
    to: string,
    edge: EdgeLabel,
  ): Promise<HotContext | null | undefined> | null | undefined

  protected abstract finalizeContextImpl(
    ctx: HotContext,
    flags: ContextFlags<Options>,
    seed: number,
  ): Promise<Context>

  #seed: number | null = null
  get seed(): number | null {
    return this.#seed
  }

  /**
   * Gets the seed that was actually used by the driver.
   * Called once after {@link initialize} and once after {@link mount}.
   */
  protected abstract getSeedImpl(
    details: ContextDetails<Context, Options>,
    info: MountInfo<Mount> | null,
  ): number | null

  abstract readonly layouts: string[]

  mount(element: HTMLElement): void {
    if (this.#context === null || this.#mount !== null) {
      throw new Error('Driver error: mount called out of order')
    }

    const {
      flags: { size },
    } = this.#context

    this.#mount = {
      mount: this.mountImpl(this.#context, element),
      element,
      size,
    }

    this.#seed = this.getSeedImpl(this.#context, this.#mount) ?? this.#seed
  }
  protected abstract mountImpl(
    details: ContextDetails<Context, Options>,
    element: HTMLElement,
  ): Mount

  resize(size: Size): void {
    if (this.#context === null || this.#mount === null) {
      throw new Error('Driver error: resize called out of order')
    }

    const { mount, element } = this.#mount
    this.#mount = {
      mount: this.resizeMountImpl(this.#context, this.#mount, size) ?? mount,
      element,
      size,
    }
  }
  protected abstract resizeMountImpl(
    details: ContextDetails<Context, Options>,
    info: MountInfo<Mount> | null,
    size: Size,
  ): Mount | null | undefined

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
}
