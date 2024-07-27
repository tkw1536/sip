import { type JSX, type Ref } from 'preact'
import type Graph from '../graph'
import * as styles from './index.module.css'
import type Driver from './impl'
import ErrorDisplay from '../../components/error'
import { type DriverClass, type ContextFlags } from './impl'
import Spinner from '../../components/spinner'
import { type Renderable } from '../graph/builders'
import { setRef } from '../utils/ref'
import { useCallback, useEffect, useRef, useState } from 'preact/hooks'
import useVisibleSize, { type Size } from '../../components/hooks/observer'

/** KernelProps are props for the current kernel */
export interface KernelProps<
  NodeLabel extends Renderable<Options, AttachmentKey>,
  EdgeLabel extends Renderable<Options, AttachmentKey>,
  Options,
  AttachmentKey extends string,
> {
  graph: Graph<NodeLabel, EdgeLabel>
  layout: string
  options: Options

  loader: DriverLoader<NodeLabel, EdgeLabel, Options, AttachmentKey>
  driver: string

  seed: number | null

  controller: Ref<KernelController<
    NodeLabel,
    EdgeLabel,
    Options,
    AttachmentKey
  > | null>
}

interface KernelWrapperProps<
  NodeLabel extends Renderable<Options, AttachmentKey>,
  EdgeLabel extends Renderable<Options, AttachmentKey>,
  Options,
  AttachmentKey extends string,
> extends KernelProps<NodeLabel, EdgeLabel, Options, AttachmentKey> {
  forceRerender: () => void
  instance: Driver<NodeLabel, EdgeLabel, Options, AttachmentKey> /* whatever */
}

interface KernelMountProps<
  NodeLabel extends Renderable<Options, AttachmentKey>,
  EdgeLabel extends Renderable<Options, AttachmentKey>,
  Options,
  AttachmentKey extends string,
> extends KernelWrapperProps<NodeLabel, EdgeLabel, Options, AttachmentKey> {
  size: Size
}

export interface DriverLoader<
  NodeLabel extends Renderable<Options, AttachmentKey>,
  EdgeLabel extends Renderable<Options, AttachmentKey>,
  Options,
  AttachmentKey extends string,
> {
  get: (
    name: string,
  ) => Promise<DriverClass<NodeLabel, EdgeLabel, Options, AttachmentKey>>
}

type InstanceState<
  NodeLabel extends Renderable<Options, AttachmentKey>,
  EdgeLabel extends Renderable<Options, AttachmentKey>,
  Options,
  AttachmentKey extends string,
> =
  | { state: 'loading' }
  | { state: 'error'; error: Error }
  | {
      state: 'loaded'
      driver: Driver<NodeLabel, EdgeLabel, Options, AttachmentKey>
    }

export default function Kernel<
  NodeLabel extends Renderable<Options, AttachmentKey>,
  EdgeLabel extends Renderable<Options, AttachmentKey>,
  Options,
  AttachmentKey extends string,
>(
  props: KernelProps<NodeLabel, EdgeLabel, Options, AttachmentKey>,
): JSX.Element {
  const [instance, setInstance] = useState<
    InstanceState<NodeLabel, EdgeLabel, Options, AttachmentKey>
  >({ state: 'loading' })

  const { loader, graph, layout, options, driver: name, seed } = props

  const [rerenderHack, setRerenderHack] = useState(0)

  // use an effect to load the class and the current instance
  // TODO: split this up into class et all
  useEffect(() => {
    let active = true

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = rerenderHack

    ;(async () => {
      const DriverClass = await loader.get(name)

      const flags: ContextFlags<Options> = Object.freeze({
        options,
        definitelyAcyclic: graph.definitelyAcyclic,

        layout,
        seed,
        size: { width: 100, height: 100 },
      })

      const driver = new DriverClass()
      await driver.initialize(graph, flags, () => active)

      return driver
    })().then(
      driver => {
        if (!active) return
        setInstance({ state: 'loaded', driver })
      },
      (err: unknown) => {
        if (!active) return
        setInstance({
          state: 'error',
          error: err instanceof Error ? err : new Error(String(err)),
        })
      },
    )

    return () => {
      active = false
      setInstance({ state: 'loading' })
    }
  }, [graph, layout, loader, name, options, rerenderHack, seed])

  const forceRerender = useCallback(() => {
    setRerenderHack(x => x + 1)
  }, [])

  switch (instance.state) {
    case 'loading':
      return (
        <Spinner
          message={'Loading is taking a bit longer, please be patient. '}
        />
      )
    case 'loaded':
      return (
        <KernelWrapper
          {...props}
          instance={instance.driver}
          forceRerender={forceRerender}
        />
      )
    case 'error':
      return <ErrorDisplay error={instance.error} />
  }
  throw new Error('never reached')
}

function KernelWrapper<
  NodeLabel extends Renderable<Options, AttachmentKey>,
  EdgeLabel extends Renderable<Options, AttachmentKey>,
  Options,
  AttachmentKey extends string,
>(
  props: KernelWrapperProps<NodeLabel, EdgeLabel, Options, AttachmentKey>,
): JSX.Element {
  const [size, ref] = useVisibleSize<HTMLDivElement>()
  return (
    <div ref={ref} class={styles.wrapper}>
      {size !== null && <KernelMount {...props} size={size} />}
    </div>
  )
}

/** MountedKernel mounts a kernel with a driver */
function KernelMount<
  NodeLabel extends Renderable<Options, AttachmentKey>,
  EdgeLabel extends Renderable<Options, AttachmentKey>,
  Options,
  AttachmentKey extends string,
>(
  props: KernelMountProps<NodeLabel, EdgeLabel, Options, AttachmentKey>,
): JSX.Element {
  const { instance, controller, size, forceRerender } = props
  const container = useRef<HTMLDivElement>(null)

  // mount the instance
  useEffect(() => {
    const { current } = container
    if (current === null) {
      throw new Error(
        'never reached: current ref MUST BE mounted during useEffect',
      )
    }

    let animating: boolean | null = null
    instance.mount(current, {
      animating: (newAnimating: boolean | null) => {
        animating = newAnimating
        setRef(
          controller,
          new KernelController(instance, animating, forceRerender),
        )
      },
    })
    setRef(controller, new KernelController(instance, animating, forceRerender))

    return () => {
      setRef(controller, null)
      instance.unmount()
    }
  }, [controller, instance, forceRerender])

  // resize the instance whenever possible
  useEffect(() => {
    instance.resize(size)
  }, [instance, size])

  return (
    <div
      style={{ width: size.width, height: size.height }}
      ref={container}
    ></div>
  )
}

/** encapsulates bi-directional controls for the browser */
export class KernelController<
  NodeLabel extends Renderable<Options, AttachmentKey>,
  EdgeLabel extends Renderable<Options, AttachmentKey>,
  Options,
  AttachmentKey extends string,
> {
  constructor(
    public readonly instance: Driver<
      NodeLabel,
      EdgeLabel,
      Options,
      AttachmentKey
    >,
    public animating: boolean | null,
    public rerender: () => void,
  ) {}
}
