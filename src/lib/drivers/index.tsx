import { type JSX, type Ref, type ComponentChildren } from 'preact'
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
import useAsyncState, { reasonAsError } from '../../components/hooks/async'

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

  driver: DriverClass<NodeLabel, EdgeLabel, Options, AttachmentKey>

  seed: number | null

  controller: Ref<KernelController<
    NodeLabel,
    EdgeLabel,
    Options,
    AttachmentKey
  > | null>
}

interface KernelMountProps<
  NodeLabel extends Renderable<Options, AttachmentKey>,
  EdgeLabel extends Renderable<Options, AttachmentKey>,
  Options,
  AttachmentKey extends string,
> extends KernelProps<NodeLabel, EdgeLabel, Options, AttachmentKey> {
  forceRerender: () => void
  instance: Driver<NodeLabel, EdgeLabel, Options, AttachmentKey> /* whatever */
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

export default function Kernel<
  NodeLabel extends Renderable<Options, AttachmentKey>,
  EdgeLabel extends Renderable<Options, AttachmentKey>,
  Options,
  AttachmentKey extends string,
>(
  props: KernelProps<NodeLabel, EdgeLabel, Options, AttachmentKey>,
): JSX.Element {
  const { graph, layout, options, seed, driver: DriverClass } = props

  // introduce a counter for how many instances we have re-created.
  // this allows the user to re-create the new instance on demand.
  const [instanceCount, setInstanceCount] = useState(0)

  const instance = useAsyncState(
    ticket => async () => {
      // re-create the instance, to allow the user to refresh the seed
      const _ = instanceCount // eslint-disable-line @typescript-eslint/no-unused-vars

      const flags: ContextFlags<Options> = {
        options,

        layout,
        seed,
      }

      const instance = new DriverClass(graph, flags)
      if (instance.driver !== DriverClass) {
        throw new Error(
          `${DriverClass.id}: instance has incorrect driver attribute`,
        )
      }
      await instance.initialize(ticket)
      return instance
    },
    [DriverClass, graph, instanceCount, layout, options, seed],
    reasonAsError,
  )

  const forceRerender = useCallback(() => {
    setInstanceCount(x => x + 1)
  }, [])

  const [size, ref] = useVisibleSize<HTMLDivElement>()

  let body: ComponentChildren
  switch (instance.status) {
    case 'pending':
      body = (
        <Spinner
          message={'Loading is taking a bit longer, please be patient. '}
        />
      )
      break
    case 'fulfilled':
      body = size !== null && (
        <KernelMount
          {...props}
          size={size}
          instance={instance.value}
          forceRerender={forceRerender}
        />
      )
      break
    case 'rejected':
      body = <ErrorDisplay error={instance.reason} />
      break
    default:
      throw new Error('never reached')
  }

  return (
    <div ref={ref} class={styles.wrapper}>
      {size !== null && body}
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
