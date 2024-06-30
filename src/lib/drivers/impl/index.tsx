import type ColorMap from '../../colormap'
import { type NamespaceMap } from '../../namespace'

export const defaultLayout = 'auto'

export interface Size { width: number, height: number }

export type ContextFlags = Readonly<{
  ns: NamespaceMap
  cm: ColorMap
  definitelyAcyclic: boolean

  layout: string
  initialSize: Size
}>

export type MountFlags = Readonly<{
  container: HTMLElement
  layout: string
  currentSize: Size
} & ContextFlags>

type _hot_context = unknown
type _context = unknown
type _mount = unknown

/** driver renders a single instance on a page */
export default interface Driver<NodeLabel, EdgeLabel> {
  readonly driverName: string
  newContext: (flags: ContextFlags) => Promise<_hot_context>
  addNode: (ctx: _hot_context, flags: ContextFlags, id: string, node: NodeLabel) => Promise<_hot_context | null | undefined>
  addEdge: (ctx: _hot_context, flags: ContextFlags, id: string, from: string, to: string, edge: EdgeLabel) => Promise<_hot_context | null | undefined>
  finalizeContext: (ctx: _hot_context, flags: ContextFlags) => Promise<_context>

  readonly supportedLayouts: string[]
  mount: (ctx: _context, flags: MountFlags) => _mount

  resizeMount: (mount: _mount, ctx: _context, flags: MountFlags, size: Size) => _mount | null | undefined
  unmount: (mount: _mount, ctx: _context, flags: MountFlags) => void

  readonly supportedExportFormats: string[]
  exportToBlob: (mount: _mount, ctx: _context, flags: MountFlags, format: string) => Promise<Blob>
}

/** implements a driver */
export abstract class DriverImpl<NodeLabel, EdgeLabel, Context, Mount, HotContext = Context> implements Driver<NodeLabel, EdgeLabel> {
  abstract readonly driverName: string
  async newContext (flags: ContextFlags): Promise<_hot_context> {
    return await this.newContextImpl(flags)
  }
  protected abstract newContextImpl (flags: ContextFlags): Promise<HotContext>

  async addNode (ctx: _hot_context, flags: ContextFlags, id: string, node: NodeLabel): Promise<_context | null | undefined> {
    return await this.addNodeImpl(ctx as HotContext, flags, id, node)
  }
  protected abstract addNodeImpl (ctx: HotContext, flags: ContextFlags, id: string, node: NodeLabel): Promise<HotContext | null | undefined> | null | undefined

  async addEdge (ctx: _hot_context, flags: ContextFlags, id: string, from: string, to: string, edge: EdgeLabel): Promise<_context | null | undefined> {
    return await this.addEdgeImpl(ctx as HotContext, flags, id, from, to, edge)
  }
  protected abstract addEdgeImpl (ctx: HotContext, flags: ContextFlags, id: string, from: string, to: string, edge: EdgeLabel): Promise<HotContext | null | undefined> | null | undefined

  async finalizeContext (ctx: _hot_context, flags: ContextFlags): Promise<_context> {
    return await this.finalizeContextImpl(ctx as HotContext, flags)
  }
  protected abstract finalizeContextImpl (ctx: HotContext, flags: ContextFlags): Promise<Context>

  abstract readonly supportedLayouts: string[]

  mount (ctx: _context, flags: MountFlags): _mount {
    return this.mountImpl(ctx as Context, flags)
  }
  protected abstract mountImpl (ctx: Context, flags: MountFlags): Mount

  resizeMount (mount: _mount, ctx: _context, flags: MountFlags, size: Size): _mount | null | undefined {
    return this.resizeMountImpl(mount as Mount, ctx as Context, flags, size)
  }
  protected abstract resizeMountImpl (mount: Mount, ctx: Context, flags: MountFlags, size: Size): Mount | null | undefined

  unmount (mount: _mount, ctx: _context, flags: MountFlags): void {
    this.unmountImpl(mount as Mount, ctx as Context, flags)
  }
  protected abstract unmountImpl (mount: Mount, ctx: Context, flags: MountFlags): void

  abstract readonly supportedExportFormats: string[]

  async exportToBlob (mount: _mount, ctx: _context, flags: MountFlags, format: string): Promise<Blob> {
    return await this.objectToBlobImpl(mount as Mount, ctx as Context, flags, format)
  }
  protected abstract objectToBlobImpl (mount: Mount, ctx: Context, flags: MountFlags, format: string): Promise<Blob>
}
