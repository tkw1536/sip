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

type _context = unknown
type _mount = unknown

/** driver renders a single instance on a page */
export default interface Driver<NodeLabel, EdgeLabel, Options> {
  readonly driverName: string

  /**
   * Creates and initializes a context for the given graph.
   * It should perform potentially expensive computations in the background (e.g. using a webworker)
   * And return the context once finished.
   *
   * The result of makeContext might be discarded if by the time it returns a different backend was requested.
   * For this reason it should clean up any running background jobs before returning.
   *
   * @param flags Flags for the context to create
   * @param graph The graph to be rendered
   * @param ticket Used for cancellation. Returns false if the result is known to be discarded. In this case makeContext may chose to throw {@link ErrorAborted}.
   */
  makeContext: (
    flags: ContextFlags<Options>,
    graph: Graph<NodeLabel, EdgeLabel>,
    ticket: () => boolean,
  ) => Promise<_context>

  readonly supportedLayouts: string[]

  /**
   * Mount mounts the context onto a page in a browser environment.
   *
   * @param ctx The context returned from {@link context}
   */
  mount: (ctx: _context, flags: MountFlags<Options>) => _mount

  resizeMount: (
    mount: _mount,
    ctx: _context,
    flags: MountFlags<Options>,
    size: Size,
  ) => _mount | null | undefined

  /**
   * Removes a mount from the page in the browser environment
   */
  unmount: (mount: _mount, ctx: _context, flags: MountFlags<Options>) => void

  readonly supportedExportFormats: string[]

  /**
   * Exports the rendered image into a blob.
   *
   * Export may be run in a browser context or a non-browser context.
   * @param ctx Context returned from {@link makeContext} to be rendered into a blob
   * @param flags Flags used to create the context
   * @param format Format to be exported in. One of {@link supportedExportFormats}.
   * @param mount Mounted object on the page, if any.
   */
  export: (
    ctx: _context,
    flags: ContextFlags<Options>,
    format: string,
    mount?: { mount: _mount; flags: MountFlags<Options> },
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

  async makeContext(
    flags: ContextFlags<Options>,
    graph: Graph<NodeLabel, EdgeLabel>,
    ticket: () => boolean,
  ): Promise<Context> {
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

    // return the context
    return ctx
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

  mount(ctx: _context, flags: MountFlags<Options>): _mount {
    return this.mountImpl(ctx as Context, flags)
  }
  protected abstract mountImpl(ctx: Context, flags: MountFlags<Options>): Mount

  resizeMount(
    mount: _mount,
    ctx: _context,
    flags: MountFlags<Options>,
    size: Size,
  ): _mount | null | undefined {
    return this.resizeMountImpl(mount as Mount, ctx as Context, flags, size)
  }
  protected abstract resizeMountImpl(
    mount: Mount,
    ctx: Context,
    flags: MountFlags<Options>,
    size: Size,
  ): Mount | null | undefined

  unmount(mount: _mount, ctx: _context, flags: MountFlags<Options>): void {
    this.unmountImpl(mount as Mount, ctx as Context, flags)
  }
  protected abstract unmountImpl(
    mount: Mount,
    ctx: Context,
    flags: MountFlags<Options>,
  ): void

  abstract readonly supportedExportFormats: string[]

  async export(
    ctx: _context,
    flags: ContextFlags<Options>,
    format: string,
    mount?: { mount: _mount; flags: MountFlags<Options> },
  ): Promise<Blob> {
    return await this.exportImpl(
      ctx as Context,
      flags,
      format,
      mount as { mount: Mount; flags: MountFlags<Options> } | undefined,
    )
  }
  protected abstract exportImpl(
    ctx: Context,
    flags: ContextFlags<Options>,
    format: string,
    mount?: { mount: Mount; flags: MountFlags<Options> },
  ): Promise<Blob>
}
