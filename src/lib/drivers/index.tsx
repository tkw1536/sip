import { Component, type ComponentChild, type Ref, createRef } from 'preact'
import type Graph from '../graph'
import * as styles from './index.module.css'
import { Operation } from '../utils/operation'
import type Driver from './impl'
import ErrorDisplay from '../../components/error'
import { type ContextFlags, type MountFlags, type Size } from './impl'
import Spinner from '../../components/spinner'

type _context = unknown
type _mount = unknown

interface KernelProps<NodeLabel, EdgeLabel, Options> {
  graph: Graph<NodeLabel, EdgeLabel>
  layout: string
  options: Options

  loader: DriverLoader<NodeLabel, EdgeLabel, Options>
  driver: string

  driverRef?: Ref<Driver<NodeLabel, EdgeLabel, Options>>
}

interface KernelState {
  size?: Size
  driverError?: Error
  driverLoading: boolean
}

export interface DriverLoader<NodeLabel, EdgeLabel, Options> {
  get: (name: string) => Promise<Driver<NodeLabel, EdgeLabel, Options>>
}

/**
 * Displays a driver on the page
 */
export default class Kernel<NodeLabel, EdgeLabel, Options> extends Component<
  KernelProps<NodeLabel, EdgeLabel, Options>,
  KernelState
> {
  static readonly #errorAborted = new Error('aborted')

  state: KernelState = { driverLoading: false }
  #mod: {
    mount: _mount
    ctx: _context
    flags: MountFlags<Options>
    driver: Driver<NodeLabel, EdgeLabel, Options>
  } | null = null

  #mountDriver(): void {
    const { current: container } = this.#container
    const { size } = this.state
    if (
      this.#mod !== null ||
      container === null ||
      typeof size === 'undefined'
    ) {
      return
    }

    const {
      graph,
      layout,
      options,
      driver: name,
      loader,
      driverRef,
    } = this.props

    const ctxFlags: ContextFlags<Options> = Object.freeze({
      options,
      definitelyAcyclic: this.props.graph.definitelyAcyclic,

      layout,
      initialSize: size,
    })

    const flags: MountFlags<Options> = Object.freeze({
      container,
      currentSize: size,
      ...ctxFlags,
    })

    // create a ticket, and make the context
    const ticket = this.#mount.ticket()

    this.setState({ driverLoading: true, driverError: undefined }, () => {
      this.#loadContext(ticket, graph, loader, name, ctxFlags)
        .then(async ({ driver, ctx }) => {
          // await to set the new state
          await new Promise<void>((resolve, reject) => {
            this.setState(
              () => {
                if (!ticket()) return null
                return { driverError: undefined, driverLoading: false }
              },
              () => {
                if (ticket()) {
                  resolve()
                } else {
                  reject(Kernel.#errorAborted)
                }
              },
            )
          })

          // check that we have a valid layout
          if (!driver.supportedLayouts.includes(flags.layout)) {
            console.error('cannot mount: unsupported driver layout received')
            return
          }

          const mount: _mount = driver.mount(ctx, flags)
          this.#mod = { mount, ctx, flags, driver }
          this.#resizeMount()

          // update the ref
          setRef(driverRef, driver)
        })
        .catch((err: unknown) => {
          if (err === Kernel.#errorAborted || !ticket()) return

          console.error('error while mounting driver: ', err)
          const driverError =
            err instanceof Error ? err : new Error(String(err))
          container.innerHTML = '' // remove whatever elements were in there
          this.setState({ driverError, driverLoading: false })
        })
    })
  }

  async #loadContext(
    ticket: () => boolean,
    graph: Graph<NodeLabel, EdgeLabel>,
    loader: DriverLoader<NodeLabel, EdgeLabel, Options>,
    name: string,
    ctxFlags: ContextFlags<Options>,
  ): Promise<{ ctx: _context; driver: Driver<NodeLabel, EdgeLabel, Options> }> {
    // load the driver
    const driver = await loader.get(name)
    const ctx = await driver.makeContext(ctxFlags, graph, ticket)

    return {
      driver,
      ctx,
    }
  }

  #unmountDriver(): void {
    if (this.#mod === null) return

    this.#mod.driver.unmount(this.#mod.mount, this.#mod.ctx, this.#mod.flags)
    this.#mod = null
    setRef(this.props.driverRef, null)
  }

  #resizeMount(): void {
    const { size } = this.state
    if (this.#mod == null || typeof size === 'undefined') return

    // call the resize function and store the new size
    const next = this.#mod.driver.resizeMount(
      this.#mod.mount,
      this.#mod.ctx,
      this.#mod.flags,
      size,
    )
    this.#mod.flags = Object.freeze({ ...this.#mod.flags, size })

    // update the mounted instance (if applicable)
    this.#mod.mount = next ?? this.#mod.mount
  }

  async exportBlob(format: string): Promise<Blob> {
    if (this.#mod == null) throw new Error('instance not setup')

    const { driver } = this.#mod
    if (!driver.supportedExportFormats.includes(format)) {
      throw new Error('unsupported blob returned')
    }

    return await driver.export(this.#mod.ctx, this.#mod.flags, format, {
      mount: this.#mod.mount,
      flags: this.#mod.flags,
    })
  }

  readonly #mount = new Operation()
  componentDidMount(): void {
    this.#createObserver()
  }

  componentDidUpdate(
    previousProps: typeof this.props,
    previousState: typeof this.state,
  ): void {
    const { size } = this.state
    const { current: container } = this.#container
    if (typeof size === 'undefined' || container === null) return

    // if any of the critical properties changed => create a new driver
    if (this.#shouldRemount(previousProps, previousState)) {
      this.#unmountDriver()
      this.#mountDriver()
      return
    }

    // if the size changed, we should update the size
    if (this.#shouldResizeMount(previousProps, previousState)) {
      this.#resizeMount()
      return // eslint-disable-line no-useless-return
    }
  }

  #shouldRemount(
    previousProps: typeof this.props,
    previousState: typeof this.state,
  ): boolean {
    return (
      // we didn't have a size before, but we do now
      (typeof previousState.size === 'undefined' &&
        typeof this.state.size !== 'undefined') ||
      // the driver or loader changed
      previousProps.driver !== this.props.driver ||
      previousProps.loader !== this.props.loader ||
      // the graph changed
      previousProps.graph !== this.props.graph ||
      // the layout changed
      previousProps.layout !== this.props.layout
    )
  }

  #shouldResizeMount(
    previousProps: typeof this.props,
    previousState: typeof this.state,
  ): boolean {
    const { size: prevSize } = previousState
    const { size } = this.state

    return (
      // either of the sizes are not defined
      typeof prevSize === 'undefined' ||
      typeof size === 'undefined' ||
      // either of the dimensions have changed
      prevSize.width !== size.width ||
      prevSize.height !== size.height
    )
  }

  componentWillUnmount(): void {
    this.#mount.cancel()
    this.#destroyObserver()
    this.#unmountDriver()
  }

  // #region "observer"
  #observer: ResizeObserver | null = null

  /** creates a resize observer unless it already exists */
  #createObserver(): void {
    // check that we don't already have an observer
    const { current: wrapper } = this.#wrapper
    if (wrapper === null || this.#observer !== null) return

    this.#observer = new ResizeObserver(this.#handleObserverResize)
    this.#observer.observe(wrapper)
  }

  /** destroys a resize observer if it exists */
  #destroyObserver(): void {
    if (this.#observer === null) return
    this.#observer.disconnect()
    this.#observer = null
  }

  /** handles updating the state to the newly observed size */
  readonly #handleObserverResize = ([entry]: ResizeObserverEntry[]): void => {
    if (this.#mount.canceled) return // no longer mounted => no need to do anything

    const [width, height] = Kernel.#getVisibleSize(entry.target)

    this.setState(({ size }) => {
      if (
        typeof size !== 'undefined' &&
        size.width === width &&
        size.height === height
      )
        return null

      return { size: { width, height } }
    })
  }

  /* returns the size of the part of target that is visible in the view port */
  static readonly #getVisibleSize = (target: Element): [number, number] => {
    const { top, bottom, left, right } = target.getBoundingClientRect()

    return [
      Math.max(Math.min(right, window.innerWidth) - Math.max(left, 0), 0),
      Math.max(Math.min(bottom, window.innerHeight) - Math.max(top, 0), 0),
    ]
  }

  // #endregion

  readonly #wrapper = createRef<HTMLDivElement>()
  readonly #container = createRef<HTMLDivElement>()
  render(): ComponentChild {
    const { size, driverLoading, driverError } = this.state

    return (
      <div ref={this.#wrapper} class={styles.wrapper}>
        {typeof size !== 'undefined' && (
          <div
            style={{ width: size.width, height: size.height }}
            ref={this.#container}
          >
            {driverLoading && (
              <Spinner
                message={
                  <>Rendering is taking a bit longer. Please be patient. </>
                }
              />
            )}
            {driverError instanceof Error && (
              <ErrorDisplay error={driverError} />
            )}
          </div>
        )}
      </div>
    )
  }
}

/** sets a reference to a specific value */
function setRef<T>(ref: Ref<T> | undefined, value: T | null): void {
  if (ref === null) return
  switch (typeof ref) {
    case 'undefined':
      return
    case 'function':
      ref(value)
      return
    default:
      ref.current = value
  }
}
