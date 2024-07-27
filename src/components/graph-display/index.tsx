import { type ComponentType, type JSX } from 'preact'
import Kernel, {
  type KernelProps,
  type DriverLoader,
  type KernelController,
} from '../../lib/drivers'
import type Graph from '../../lib/graph'

import ErrorDisplay from '../error'
import { useEffect, useState } from 'preact/hooks'
import { Panel } from '../layout/panel'
import { type Renderable } from '../../lib/graph/builders'

interface GraphProps<
  NodeLabel extends Renderable<Options, AttachmentKey>,
  EdgeLabel extends Renderable<Options, AttachmentKey>,
  Options,
  AttachmentKey extends string,
> {
  loader: DriverLoader<NodeLabel, EdgeLabel, Options, AttachmentKey>
  driver: string

  builderKey: string
  makeGraph: () => Promise<Graph<NodeLabel, EdgeLabel>>

  options: Options
  layout: string
  seed: number | null

  panel: ComponentType<PanelProps<NodeLabel, EdgeLabel, Options, AttachmentKey>>
}

export interface PanelProps<
  NodeLabel extends Renderable<Options, AttachmentKey>,
  EdgeLabel extends Renderable<Options, AttachmentKey>,
  Options,
  AttachmentKey extends string,
> {
  controller: KernelController<
    NodeLabel,
    EdgeLabel,
    Options,
    AttachmentKey
  > | null
}

type GraphLoadState<NodeLabel, EdgeLabel> =
  | { state: 'build' }
  | { state: 'error'; error: unknown }
  | { state: 'done'; graph: Graph<NodeLabel, EdgeLabel> }

export default function GraphDisplay<
  NodeLabel extends Renderable<Options, AttachmentKey>,
  EdgeLabel extends Renderable<Options, AttachmentKey>,
  Options,
  AttachmentKey extends string,
>(
  props: GraphProps<NodeLabel, EdgeLabel, Options, AttachmentKey>,
): JSX.Element {
  const {
    loader,
    driver,
    options,
    layout,
    seed,
    makeGraph,
    panel: GraphDisplayPanel,
  } = props
  const [graph, setGraph] = useState<GraphLoadState<NodeLabel, EdgeLabel>>({
    state: 'build',
  })

  const [open, setOpen] = useState(false)

  useEffect(() => {
    let active = true
    makeGraph().then(
      graph => {
        if (!active) return
        setGraph({ state: 'done', graph })
      },
      error => {
        if (!active) return
        setGraph({ state: 'error', error })
      },
    )

    return () => {
      active = false
      setGraph({ state: 'build' })
    }
  }, [makeGraph])

  const [controller, setController] = useState<KernelController<
    NodeLabel,
    EdgeLabel,
    Options,
    AttachmentKey
  > | null>(null)

  return (
    <Panel
      panel={<GraphDisplayPanel controller={controller} />}
      open={open}
      setOpen={setOpen}
    >
      <GraphDisplayMain
        graph={graph}
        loader={loader}
        driver={driver}
        controller={setController}
        options={options}
        layout={layout}
        seed={seed}
      />
    </Panel>
  )
}

interface GraphDisplayMainProps<
  NodeLabel extends Renderable<Options, AttachmentKey>,
  EdgeLabel extends Renderable<Options, AttachmentKey>,
  Options,
  AttachmentKey extends string,
> extends Omit<
    KernelProps<NodeLabel, EdgeLabel, Options, AttachmentKey>,
    'graph'
  > {
  graph: GraphLoadState<NodeLabel, EdgeLabel>
}

function GraphDisplayMain<
  NodeLabel extends Renderable<Options, AttachmentKey>,
  EdgeLabel extends Renderable<Options, AttachmentKey>,
  Options,
  AttachmentKey extends string,
>(
  props: GraphDisplayMainProps<NodeLabel, EdgeLabel, Options, AttachmentKey>,
): JSX.Element | null {
  const { graph, ...rest } = props

  if (graph.state === 'build') {
    return null
  }
  if (graph.state === 'error') {
    return <ErrorDisplay error={graph.error} />
  }

  return <Kernel {...rest} graph={graph.graph} />
}
