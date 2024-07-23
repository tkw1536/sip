import { type JSX, type RefObject } from 'preact'
import GraphDisplay, {
  DriverControl,
  ExportControl,
} from '../../../components/graph-display'
import BundleGraphBuilder, {
  type BundleOptions,
  type BundleEdge,
  type BundleNode,
} from '../../../lib/graph/builders/bundle'
import { bundles } from '../../../lib/drivers/collection'
import type Driver from '../../../lib/drivers/impl'
import {
  setBundleDriver,
  setBundleLayout,
  setBundleSeed,
} from '../state/reducers/bundle'
import type Graph from '../../../lib/graph'
import { useInspectorStore } from '../state'
import { useCallback, useMemo, useRef } from 'preact/hooks'

export default function BundleGraphTab(): JSX.Element {
  const selection = useInspectorStore(s => s.selection)
  const tree = useInspectorStore(s => s.tree)
  const bundleGraphLayout = useInspectorStore(s => s.bundleGraphLayout)
  const bundleGraphRenderer = useInspectorStore(s => s.bundleGraphDriver)
  const bundleGraphSeed = useInspectorStore(s => s.bundleGraphSeed)
  const pathbuilderVersion = useInspectorStore(s => s.pathbuilderVersion)
  const selectionVersion = useInspectorStore(s => s.selectionVersion)
  const colorVersion = useInspectorStore(s => s.colorVersion)
  const ns = useInspectorStore(s => s.ns)
  const cm = useInspectorStore(s => s.cm)

  const makeGraph = useMemo(
    () => async (): Promise<Graph<BundleNode, BundleEdge>> => {
      const builder = new BundleGraphBuilder(tree, selection)
      return await builder.build()
    },
    [BundleGraphBuilder, tree, selection],
  )

  const displayRef =
    useRef<GraphDisplay<BundleNode, BundleEdge, BundleOptions, never>>(null)

  const options = useMemo(() => ({ ns, cm }), [ns, cm])

  const renderPanel = useCallback(
    (
      driver: BundleGraphPanelProps['driver'],
      animating: BundleGraphPanelProps['animating'],
    ) => {
      return (
        <BundleGraphPanel
          displayRef={displayRef}
          driver={driver}
          animating={animating}
        />
      )
    },
    [BundleGraphPanel, displayRef],
  )

  return (
    <GraphDisplay
      ref={displayRef}
      loader={bundles}
      driver={bundleGraphRenderer}
      seed={bundleGraphSeed}
      builderKey={`${pathbuilderVersion}-${selectionVersion}-${colorVersion}`}
      makeGraph={makeGraph}
      options={options}
      layout={bundleGraphLayout}
      panel={renderPanel}
    />
  )
}

interface BundleGraphPanelProps {
  displayRef: RefObject<
    GraphDisplay<BundleNode, BundleEdge, BundleOptions, never>
  >
  driver: Driver<BundleNode, BundleEdge, BundleOptions, never> | null
  animating: boolean | null
}

function BundleGraphPanel(props: BundleGraphPanelProps): JSX.Element {
  const apply = useInspectorStore(s => s.apply)
  const layout = useInspectorStore(s => s.bundleGraphLayout)
  const seed = useInspectorStore(s => s.bundleGraphSeed)

  const { animating, driver, displayRef } = props

  const handleChangeBundleRenderer = useCallback(
    (value: string): void => {
      apply(setBundleDriver(value))
    },
    [apply, setBundleDriver],
  )
  const handleChangeBundleLayout = useCallback(
    (value: string): void => {
      apply(setBundleLayout(value))
    },
    [apply, setBundleLayout],
  )
  const handleChangeBundleSeed = useCallback(
    (seed: number | null): void => {
      apply(setBundleSeed(seed))
    },
    [apply, setBundleSeed],
  )
  const handleResetDriver = useCallback((): void => {
    const { current: display } = displayRef
    display?.remount()
  }, [displayRef])

  return (
    <>
      <DriverControl
        driverNames={bundles.names}
        driver={driver}
        currentLayout={layout}
        seed={seed}
        onChangeDriver={handleChangeBundleRenderer}
        onChangeLayout={handleChangeBundleLayout}
        onChangeSeed={handleChangeBundleSeed}
        onResetDriver={handleResetDriver}
        animating={animating}
      />
      <ExportControl driver={driver} display={displayRef.current} />
    </>
  )
}
