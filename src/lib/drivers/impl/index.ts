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
  initialSize: Size
}>

export type MountFlags<Options> = Readonly<
  {
    container: HTMLElement
    layout: string
    currentSize: Size
  } & ContextFlags<Options>
>

export type DriverClass<NodeLabel, EdgeLabel, Options> = new () => Driver<
  NodeLabel,
  EdgeLabel,
  Options
>

/** driver renders a single instance on a page */
export default interface Driver<NodeLabel, EdgeLabel, Options> {
  readonly driverName: string

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
    flags: ContextFlags<Options>,
    graph: Graph<NodeLabel, EdgeLabel>,
    ticket: () => boolean,
  ) => Promise<void>

  readonly supportedLayouts: string[]

  /** mounts this instance onto the page */
  mount: (flags: MountFlags<Options>) => void

  /** resizes this instance which is already {@link mount}ed onto the page */
  resize: (flags: MountFlags<Options>, size: Size) => void

  /** unmounts the {@link mount}ed instance from the page */
  unmount: (flags: MountFlags<Options>) => void

  readonly supportedExportFormats: string[]

  /**
   * Exports the rendered image into a blob.
   *
   * Export may be run in a browser context or a non-browser context.
   * @param ctx Context returned from {@link initialize} to be rendered into a blob
   * @param flags Flags used to create the context
   * @param format Format to be exported in. One of {@link supportedExportFormats}.
   * @param mount Options used for mounting on the page.
   */
  export: (
    flags: ContextFlags<Options>,
    format: string,
    mount?: MountFlags<Options>,
  ) => Promise<Blob>
}

/** indicates to the caller that the driver has aborted it's current operation */
export const ErrorAborted = new Error('Driver: aborted')

/** thrown if an operation is not supported */
export const ErrorUnsupported = new Error('Driver: Not supported')

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

  #context: Context | null = null
  #mount: Mount | null = null

  async initialize(
    flags: ContextFlags<Options>,
    graph: Graph<NodeLabel, EdgeLabel>,
    ticket: () => boolean,
  ): Promise<void> {
    if (this.#context !== null || this.#mount !== null) {
      throw new Error('Driver error: initialize called out of order')
    }

    const ids = new IDPool()
    if (!ticket()) throw ErrorAborted

    let hCtx = await this.newContextImpl(flags)
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
    const ctx = await this.finalizeContextImpl(hCtx, flags)
    if (!ticket()) throw ErrorAborted

    this.#context = ctx
  }
  protected abstract newContextImpl(
    flags: ContextFlags<Options>,
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
  ): Promise<Context>

  abstract readonly supportedLayouts: string[]

  mount(flags: MountFlags<Options>): void {
    if (this.#context === null || this.#mount !== null) {
      throw new Error('Driver error: mount called out of order')
    }

    this.#mount = this.mountImpl(this.#context, flags)
  }
  protected abstract mountImpl(ctx: Context, flags: MountFlags<Options>): Mount

  resize(flags: MountFlags<Options>, size: Size): void {
    if (this.#context === null || this.#mount === null) {
      throw new Error('Driver error: resize called out of order')
    }

    this.#mount =
      this.resizeMountImpl(this.#mount, this.#context, flags, size) ??
      this.#mount
  }
  protected abstract resizeMountImpl(
    mount: Mount,
    ctx: Context,
    flags: MountFlags<Options>,
    size: Size,
  ): Mount | null | undefined

  unmount(flags: MountFlags<Options>): void {
    if (this.#context === null || this.#mount === null) {
      throw new Error('Driver error: unmount called out of order')
    }
    this.unmountImpl(this.#mount, this.#context, flags)
    this.#mount = null
  }
  protected abstract unmountImpl(
    mount: Mount,
    ctx: Context,
    flags: MountFlags<Options>,
  ): void

  abstract readonly supportedExportFormats: string[]

  async export(
    flags: ContextFlags<Options>,
    format: string,
    mount?: MountFlags<Options>,
  ): Promise<Blob> {
    if (this.#context === null) {
      throw new Error('Driver error: export called out of order')
    }
    let options: { mount: Mount; flags: MountFlags<Options> } | undefined
    if (typeof mount !== 'undefined') {
      if (this.#mount === null) {
        throw new Error('Driver error: export called out of order')
      }
      options = { mount: this.#mount, flags: mount }
    }
    return await this.exportImpl(this.#context, flags, format, options)
  }
  protected abstract exportImpl(
    ctx: Context,
    flags: ContextFlags<Options>,
    format: string,
    mount?: { mount: Mount; flags: MountFlags<Options> },
  ): Promise<Blob>
}
