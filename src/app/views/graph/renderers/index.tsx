import { Component, ComponentChild, createRef } from 'preact'
import Graph from '../../../../lib/graph'
import { NamespaceMap } from '../../../../lib/namespace'
import * as styles from './index.module.css'
import { UUIDPool } from '../../../../lib/utils/uuid'

interface RendererProps<NodeLabel, EdgeLabel> {
  layout: string
  graph: Graph<NodeLabel, EdgeLabel>
  ns: NamespaceMap
  driver: Driver<NodeLabel, EdgeLabel>
}
export const defaultLayout = 'auto'

interface RenderState { size?: [number, number] }
/**
 * Renderer instantiates a renderer onto the page
 */
export class Renderer<NodeLabel, EdgeLabel> extends Component<RendererProps<NodeLabel, EdgeLabel>, RenderState> {
  state: RenderState = {}

  async exportBlob (format: string): Promise<Blob> {
    const { current: kernel } = this.kernelRef
    if (kernel == null) {
      return await Promise.reject(new Error('no visible kernel'))
    }

    return await kernel.toBlob(format)
  }

  private readonly wrapperRef = createRef<HTMLDivElement>()
  private readonly kernelRef = createRef<Kernel<NodeLabel, EdgeLabel>>()

  private observer: ResizeObserver | null = null

  private readonly onResize = ([entry]: ResizeObserverEntry[]): void => {
    const [width, height] = Renderer.getVisibleSize(entry.target)

    this.setState(({ size }) => {
      // if the previous size is identical, don't resize
      if ((size != null) && size[0] === width && size[1] === height) {
        return null
      }
      return { size: [width, height] }
    })
  }

  /* returns the size of the part of target that is visible in the view port */
  private static readonly getVisibleSize = (target: Element): [number, number] => {
    const { top, bottom, left, right } = target.getBoundingClientRect()

    return [
      Math.max(Math.min(right, window.innerWidth) - Math.max(left, 0), 0),
      Math.max(Math.min(bottom, window.innerHeight) - Math.max(top, 0), 0)
    ]
  }

  componentDidMount (): void {
    const { current } = this.wrapperRef
    if (this.observer == null && current !== null) {
      this.observer = new ResizeObserver(this.onResize)
      this.observer.observe(current)
    }
  }

  componentWillUnmount (): void {
    if (this.observer != null) {
      this.observer.disconnect()
      this.observer = null
    }
  }

  render (): ComponentChild {
    const { driver, ...props } = this.props
    const { size } = this.state
    return (
      <div ref={this.wrapperRef} class={styles.wrapper}>
        {(size != null) && <Kernel ref={this.kernelRef} {...props} driver={driver} size={{ width: size[0], height: size[1] }} />}
      </div>
    )
  }
}

export interface Size { width: number, height: number }

export type ContextFlags = Readonly<{
  ns: NamespaceMap
  definitelyAcyclic: boolean
}>

export type MountFlags = Readonly<{
  container: HTMLElement
  layout: string
  size: Size
} & ContextFlags>

type _context = unknown
type _mount = unknown

/** driver implements a driver for a single library */
export interface Driver<NodeLabel, EdgeLabel> {
  initializeClass: () => Promise<void>

  readonly rendererName: string
  newContext: (flags: ContextFlags) => _context
  addNode: (ctx: _context, flags: ContextFlags, id: string, node: NodeLabel) => _context | null | undefined
  addEdge: (ctx: _context, flags: ContextFlags, id: string, from: string, to: string, edge: EdgeLabel) => _context | null | undefined
  finalizeContext: (ctx: _context, flags: ContextFlags) => _context | null | undefined

  readonly supportedLayouts: string[]
  mount: (ctx: _context, flags: MountFlags) => _mount

  resizeMount: (mount: _mount, ctx: _context, flags: MountFlags, size: Size) => _mount | null | undefined
  unmount: (mount: _mount, ctx: _context, flags: MountFlags) => void

  readonly supportedExportFormats: string[]
  objectToBlob: (mount: _mount, ctx: _context, flags: MountFlags, format: string) => Promise<Blob>
}

export abstract class DriverImpl<NodeLabel, EdgeLabel, Context, Mount> implements Driver<NodeLabel, EdgeLabel> {
  protected constructor () {}
  abstract initializeClass (): Promise<void>

  abstract readonly rendererName: string
  newContext (flags: ContextFlags): _context {
    return this.newContextImpl(flags)
  }
  protected abstract newContextImpl (flags: ContextFlags): Context

  addNode (ctx: _context, flags: ContextFlags, id: string, node: NodeLabel): _context | null | undefined {
    return this.addNodeImpl(ctx as Context, flags, id, node)
  }
  protected abstract addNodeImpl (ctx: Context, flags: ContextFlags, id: string, node: NodeLabel): Context | null | undefined

  addEdge (ctx: _context, flags: ContextFlags, id: string, from: string, to: string, edge: EdgeLabel): _context | null | undefined {
    return this.addEdgeImpl(ctx as Context, flags, id, from, to, edge)
  }
  protected abstract addEdgeImpl (ctx: Context, flags: ContextFlags, id: string, from: string, to: string, edge: EdgeLabel): Context | null | undefined

  finalizeContext (ctx: _context, flags: ContextFlags): _context | null | undefined {
    return this.finalizeContextImpl(ctx as Context, flags)
  }
  protected abstract finalizeContextImpl (ctx: Context, flags: ContextFlags): Context | null | undefined

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

  async objectToBlob (mount: _mount, ctx: _context, flags: MountFlags, format: string): Promise<Blob> {
    return await this.objectToBlobImpl(mount as Mount, ctx as Context, flags, format)
  }
  protected abstract objectToBlobImpl (mount: Mount, ctx: Context, flags: MountFlags, format: string): Promise<Blob>
}

type KernelProps<NodeLabel, EdgeLabel> = RendererProps<NodeLabel, EdgeLabel> & { size: Size, driver: Driver<NodeLabel, EdgeLabel>, layout: string }

/** Kernel uses a driver to display a renderer */
class Kernel<NodeLabel, EdgeLabel> extends Component<KernelProps<NodeLabel, EdgeLabel>> {
  private instance: { mount: _mount, ctx: _context, flags: MountFlags, driver: Driver<NodeLabel, EdgeLabel> } | null = null

  private createRenderer (): void {
    const { current: container } = this.container
    if ((this.instance != null) || (container == null)) {
      return
    }

    const { graph, size, layout, driver } = this.props
    const ids = new UUIDPool()

    const ctxFlags: ContextFlags = Object.freeze({
      ns: this.props.ns,
      definitelyAcyclic: this.props.graph.definitelyAcyclic
    })

    const flags: MountFlags = Object.freeze({
      container,
      layout,
      size,
      ...ctxFlags
    })

    // check that we have a valid layout
    if (!driver.supportedLayouts.includes(layout)) {
      console.error('cannot mount: unsupported driver layout received')
      return
    }

    try {
      // create a new context
      let ctx = driver.newContext(ctxFlags)

      // add all nodes and edges
      graph.getNodes().forEach(([id, node]) => {
        ctx = driver.addNode(ctx, ctxFlags, ids.for(id), node) ?? ctx
      })
      graph.getEdges().forEach(([id, from, to, edge]) => {
        ctx = driver.addEdge(ctx, ctxFlags, ids.for(id), ids.for(from), ids.for(to), edge) ?? ctx
      })

      // finalize the context
      ctx = driver.finalizeContext(ctx, ctxFlags) ?? ctx

      // mount it to the page
      const mount = driver.mount(ctx, flags)

      this.instance = { mount, ctx, flags, driver }
    } catch (e) {
      console.error('failed to render graph')
      console.error(e)
      return
    }

    this.updateRendererSize()
  }

  private destroyRenderer (): void {
    if (this.instance === null) return
    this.instance.driver.unmount(this.instance.mount, this.instance.ctx, this.instance.flags)
    this.instance = null
  }

  private updateRendererSize (): void {
    if (this.instance == null) return
    const { size } = this.props

    // call the resize function and store the new size
    const next = this.instance.driver.resizeMount(this.instance.mount, this.instance.ctx, this.instance.flags, size)
    this.instance.flags = Object.freeze({ ...this.instance.flags, size })

    // update the mounted instance (if applicable)
    if (typeof next === 'undefined') return
    this.instance.mount = next
  }

  async toBlob (format: string): Promise<Blob> {
    if (this.instance == null) throw new Error('instance not setup')

    const { driver } = this.instance
    if (!driver.supportedExportFormats.includes(format)) {
      throw new Error('unsupported blob returned')
    }

    return await driver.objectToBlob(this.instance.mount, this.instance.ctx, this.instance.flags, format)
  }

  componentDidMount (): void {
    this.createRenderer()
  }

  componentDidUpdate (previousProps: typeof this.props): void {
    const { size: { width, height }, graph, driver, layout } = this.props

    // if any of the critical properties changed => create a new driver
    if (previousProps.driver !== driver || previousProps.graph !== graph || previousProps.layout !== layout) {
      this.destroyRenderer()
      this.createRenderer()
      return
    }

    if (previousProps.size.width === width && previousProps.size.height !== height) {
      return // size didn't change => no need to do anything
    }

    this.updateRendererSize()
  }

  private readonly container = createRef<HTMLDivElement>()
  render (): ComponentChild {
    const { size: { width, height } } = this.props
    return <div style={{ width, height }} ref={this.container} />
  }
}
