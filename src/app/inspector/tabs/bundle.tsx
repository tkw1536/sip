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
  const tree = useInspectorStore(s => s.tree)
  const pbVersion = useInspectorStore(s => s.pathbuilderVersion)
  const selection = useInspectorStore(s => s.selection)
  const selectionVersion = useInspectorStore(s => s.selectionVersion)
  const driver = useInspectorStore(s => s.bundleGraphDriver)
  const layout = useInspectorStore(s => s.bundleGraphLayout)
  const seed = useInspectorStore(s => s.bundleGraphSeed)
  const ns = useInspectorStore(s => s.ns)
  const cm = useInspectorStore(s => s.cm)
  const cmVersion = useInspectorStore(s => s.colorVersion)

  const makeGraph = useMemo(
    () => async (): Promise<Graph<BundleNode, BundleEdge>> => {
      const builder = new BundleGraphBuilder(tree, selection)
      return await builder.build()
    },
    [tree, selection],
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
    [displayRef],
  )

  return (
    <GraphDisplay
      ref={displayRef}
      loader={bundles}
      driver={driver}
      seed={seed}
      builderKey={`${pbVersion}-${selectionVersion}-${cmVersion}`}
      makeGraph={makeGraph}
      options={options}
      layout={layout}
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
    [apply],
  )
  const handleChangeBundleLayout = useCallback(
    (value: string): void => {
      apply(setBundleLayout(value))
    },
    [apply],
  )
  const handleChangeBundleSeed = useCallback(
    (seed: number | null): void => {
      apply(setBundleSeed(seed))
    },
    [apply],
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
