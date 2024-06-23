import { Component, ComponentChild, createRef } from 'preact'
import Graph from '../graph'
import { NamespaceMap } from '../namespace'
import * as styles from './index.module.css'
import { UUIDPool } from '../utils/uuid'
import { Operation } from '../utils/operation'
import Driver from './impl'

export const defaultLayout = 'auto'

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

interface KernelProps<NodeLabel, EdgeLabel> {
  graph: Graph<NodeLabel, EdgeLabel>
  layout: string
  ns: NamespaceMap
  driver: Driver<NodeLabel, EdgeLabel>
}

interface KernelState { size?: Size, driverError?: string, driverLoading: boolean }

/**
 * Displays a driver on the page
 */
export default class Kernel<NodeLabel, EdgeLabel> extends Component<KernelProps<NodeLabel, EdgeLabel>, KernelState> {
  private static readonly errorAborted = new Error('aborted')

  state: KernelState = { driverLoading: false }
  private instance: { mount: _mount, ctx: _context, flags: MountFlags, driver: Driver<NodeLabel, EdgeLabel> } | null = null

  private mountDriver (): void {
    const { current: container } = this.container
    const { size } = this.state
    if ((this.instance !== null) || (container === null) || (typeof size === 'undefined')) {
      return
    }

    const { graph, layout, driver } = this.props

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
    if (!driver.supportedLayouts.includes(flags.layout)) {
      console.error('cannot mount: unsupported driver layout received')
      return
    }

    // create a ticket, and make the context
    const setState = this.mount.ticketStateSetter(this)

    this.setState({ driverLoading: true, driverError: undefined }, () => {
      this.createContext(setState.ticket, graph, driver, ctxFlags)
        .then(async (ctx: _context) => {
          // we've finished loading the page, not make everything sync
          await setState({ driverError: undefined, driverLoading: false })
          if (!setState.ticket()) throw Kernel.errorAborted

          const mount: _mount = driver.mount(ctx, flags)
          this.instance = { mount, ctx, flags, driver }
          this.resizeMount()
        })
        .catch((err: unknown) => {
          if (err === Kernel.errorAborted || !setState.ticket()) return

          console.error('error while mounting driver: ', err)
          this.setState({ driverError: Object.prototype.toString.call(err), driverLoading: false })
        })
    })
  }

  private async createContext (ticket: () => boolean, graph: Graph<NodeLabel, EdgeLabel>, driver: Driver<NodeLabel, EdgeLabel>, ctxFlags: ContextFlags): Promise<_context> {
    const ids = new UUIDPool()

    // create a new context
    let ctx = await driver.newContext(ctxFlags)
    if (!ticket()) throw Kernel.errorAborted

    // add all nodes and edges
    for (const [id, node] of graph.getNodes()) {
      ctx = (await driver.addNode(ctx, ctxFlags, ids.for(id), node)) ?? ctx
      if (!ticket()) throw Kernel.errorAborted
    }
    for (const [id, from, to, edge] of graph.getEdges()) {
      ctx = (await driver.addEdge(ctx, ctxFlags, ids.for(id), ids.for(from), ids.for(to), edge)) ?? ctx
      if (!ticket()) throw Kernel.errorAborted
    }

    // finalize the context
    ctx = (await driver.finalizeContext(ctx, ctxFlags)) ?? ctx
    if (!ticket()) throw Kernel.errorAborted

    return ctx
  }

  private unmountDriver (): void {
    if (this.instance === null) return
    this.instance.driver.unmount(this.instance.mount, this.instance.ctx, this.instance.flags)
    this.instance = null
  }

  private resizeMount (): void {
    const { size } = this.state
    if (this.instance == null || typeof size === 'undefined') return

    // call the resize function and store the new size
    const next = this.instance.driver.resizeMount(this.instance.mount, this.instance.ctx, this.instance.flags, size)
    this.instance.flags = Object.freeze({ ...this.instance.flags, size })

    // update the mounted instance (if applicable)
    this.instance.mount = next ?? this.instance.mount
  }

  async exportBlob (format: string): Promise<Blob> {
    if (this.instance == null) throw new Error('instance not setup')

    const { driver } = this.instance
    if (!driver.supportedExportFormats.includes(format)) {
      throw new Error('unsupported blob returned')
    }

    return await driver.exportToBlob(this.instance.mount, this.instance.ctx, this.instance.flags, format)
  }

  private readonly mount = new Operation()
  componentDidMount (): void {
    this.createObserver()
  }

  componentDidUpdate (previousProps: typeof this.props, previousState: typeof this.state): void {
    const { size } = this.state
    const { current: container } = this.container
    if (typeof size === 'undefined' || container === null) return

    // if any of the critical properties changed => create a new driver
    if (this.shouldRemount(previousProps, previousState)) {
      this.unmountDriver()
      this.mountDriver()
      return
    }

    // if the size changed, we should update the size
    if (this.shouldResizeMount(previousProps, previousState)) {
      this.resizeMount()
      return // eslint-disable-line no-useless-return
    }
  }

  private shouldRemount (previousProps: typeof this.props, previousState: typeof this.state): boolean {
    return (
      // we didn't have a size before, but we do now
      (typeof previousState.size === 'undefined' && typeof this.state.size !== 'undefined') ||

      // the driver changed
      (previousProps.driver !== this.props.driver) ||

      // the graph changed
      (previousProps.graph !== this.props.graph) ||

      // the layout changed
      (previousProps.layout !== this.props.layout)
    )
  }

  private shouldResizeMount (previousProps: typeof this.props, previousState: typeof this.state): boolean {
    const { size: prevSize } = previousState
    const { size } = this.state

    return (
      // either of the sizes are not defined
      (typeof prevSize === 'undefined' || typeof size === 'undefined') ||

      // either of the dimensions have changed
      (prevSize.width !== size.width) ||
      (prevSize.height !== size.height)
    )
  }

  componentWillUnmount (): void {
    this.mount.cancel()
    this.destroyObserver()
    this.unmountDriver()
  }

  // #region "observer"
  private observer: ResizeObserver | null = null

  /** creates a resize observer unless it already exists */
  private createObserver (): void {
    // check that we don't already have an observer
    const { current: wrapper } = this.wrapper
    if (wrapper === null || this.observer !== null) return

    this.observer = new ResizeObserver(this.handleObserverResize)
    this.observer.observe(wrapper)
  }

  /** destroys a resize observer if it exists */
  private destroyObserver (): void {
    if (this.observer === null) return
    this.observer.disconnect()
    this.observer = null
  }

  /** handles updating the state to the newly observed size */
  private readonly handleObserverResize = ([entry]: ResizeObserverEntry[]): void => {
    if (this.mount.canceled) return // no longer mounted => no need to do anything

    const [width, height] = Kernel.getVisibleSize(entry.target)

    this.setState(({ size }) => {
      if (typeof size !== 'undefined' && size.width === width && size.height === height) return null

      return { size: { width, height } }
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

  // #endregion

  private readonly wrapper = createRef<HTMLDivElement>()
  private readonly container = createRef<HTMLDivElement>()
  render (): ComponentChild {
    const { size, driverLoading, driverError } = this.state

    return (
      <div ref={this.wrapper} class={styles.wrapper}>
        {(typeof size !== 'undefined') && (
          <div style={{ width: size.width, height: size.height }} ref={this.container}>
            {driverLoading && <p>Driver loading</p>}
            {typeof driverError === 'string' && <p><b>Error loading driver: </b>{driverError}</p>}
          </div>
        )}
      </div>
    )
  }
}
