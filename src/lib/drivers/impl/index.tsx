import ColorMap from '../../colormap'
import { NamespaceMap } from '../../namespace'

export const defaultLayout = 'auto'

export const formatSVG = 'image/svg+xml'
export const formatPNG = 'image/png'
export const formatGraphViz = 'text/vnd.graphviz'
export const formatJSON = 'application/json'

export interface Size { width: number, height: number }

export type ContextFlags = Readonly<{
  ns: NamespaceMap
  cm: ColorMap
  definitelyAcyclic: boolean
}>

export type MountFlags = Readonly<{
  container: HTMLElement
  layout: string
  size: Size
} & ContextFlags>

type _context = unknown
type _mount = unknown

/** driver renders a single instance on a page */
export default interface Driver<NodeLabel, EdgeLabel> {
  readonly driverName: string
  newContext: (flags: ContextFlags) => Promise<_context>
  addNode: (ctx: _context, flags: ContextFlags, id: string, node: NodeLabel) => Promise<_context | null | undefined>
  addEdge: (ctx: _context, flags: ContextFlags, id: string, from: string, to: string, edge: EdgeLabel) => Promise<_context | null | undefined>
  finalizeContext: (ctx: _context, flags: ContextFlags) => Promise<_context | null | undefined>

  readonly supportedLayouts: string[]
  mount: (ctx: _context, flags: MountFlags) => _mount

  resizeMount: (mount: _mount, ctx: _context, flags: MountFlags, size: Size) => _mount | null | undefined
  unmount: (mount: _mount, ctx: _context, flags: MountFlags) => void

  readonly supportedExportFormats: string[]
  exportToBlob: (mount: _mount, ctx: _context, flags: MountFlags, format: string) => Promise<Blob>
}

/** implements a driver */
export abstract class DriverImpl<NodeLabel, EdgeLabel, Context, Mount> implements Driver<NodeLabel, EdgeLabel> {
  protected constructor () { }

  abstract readonly driverName: string
  async newContext (flags: ContextFlags): Promise<_context> {
    return await this.newContextImpl(flags)
  }
  protected abstract newContextImpl (flags: ContextFlags): Promise<Context>

  async addNode (ctx: _context, flags: ContextFlags, id: string, node: NodeLabel): Promise<_context | null | undefined> {
    return await this.addNodeImpl(ctx as Context, flags, id, node)
  }
  protected abstract addNodeImpl (ctx: Context, flags: ContextFlags, id: string, node: NodeLabel): Promise<Context | null | undefined>

  async addEdge (ctx: _context, flags: ContextFlags, id: string, from: string, to: string, edge: EdgeLabel): Promise<_context | null | undefined> {
    return await this.addEdgeImpl(ctx as Context, flags, id, from, to, edge)
  }
  protected abstract addEdgeImpl (ctx: Context, flags: ContextFlags, id: string, from: string, to: string, edge: EdgeLabel): Promise<Context | null | undefined>

  async finalizeContext (ctx: _context, flags: ContextFlags): Promise<_context | null | undefined> {
    return await this.finalizeContextImpl(ctx as Context, flags)
  }
  protected abstract finalizeContextImpl (ctx: Context, flags: ContextFlags): Promise<Context | null | undefined>

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
    return this.unmountImpl(mount as Mount, ctx as Context, flags)
  }
  protected abstract unmountImpl (mount: Mount, ctx: Context, flags: MountFlags): void

  abstract readonly supportedExportFormats: string[]

  async exportToBlob (mount: _mount, ctx: _context, flags: MountFlags, format: string): Promise<Blob> {
    return await this.objectToBlobImpl(mount as Mount, ctx as Context, flags, format)
  }
  protected abstract objectToBlobImpl (mount: Mount, ctx: Context, flags: MountFlags, format: string): Promise<Blob>
}
