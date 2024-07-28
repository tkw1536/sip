import { type JSX } from 'preact'
import GraphDisplay, {
  type PanelProps,
} from '../../../components/graph-display'
import {
  DriverControl,
  ExportControl,
} from '../../../components/graph-display/controls'
import BundleGraphBuilder, {
  type BundleOptions,
  type BundleEdge,
  type BundleNode,
} from '../../../lib/graph/builders/bundle'
import { bundles } from '../../../lib/drivers/collection'
import {
  setBundleDriver,
  setBundleLayout,
  setBundleSeed,
} from '../state/reducers/bundle'
import type Graph from '../../../lib/graph'
import { useInspectorStore } from '../state'
import { useCallback, useMemo } from 'preact/hooks'

export default function BundleGraphTab(): JSX.Element {
  const tree = useInspectorStore(s => s.tree)
  const selection = useInspectorStore(s => s.selection)
  const driver = useInspectorStore(s => s.bundleGraphDriver)
  const layout = useInspectorStore(s => s.bundleGraphLayout)
  const seed = useInspectorStore(s => s.bundleGraphSeed)
  const ns = useInspectorStore(s => s.ns)
  const cm = useInspectorStore(s => s.cm)

  const makeGraph = useMemo(
    () => async (): Promise<Graph<BundleNode, BundleEdge>> => {
      const builder = new BundleGraphBuilder(tree, selection)
      return builder.build()
    },
    [tree, selection],
  )

  const options = useMemo(() => ({ ns, cm }), [ns, cm])

  return (
    <GraphDisplay
      loader={bundles}
      name={driver}
      seed={seed}
      makeGraph={makeGraph}
      options={options}
      layout={layout}
      panel={BundleGraphPanel}
    />
  )
}

function BundleGraphPanel(
  props: PanelProps<BundleNode, BundleEdge, BundleOptions, never>,
): JSX.Element {
  const apply = useInspectorStore(s => s.apply)
  const layout = useInspectorStore(s => s.bundleGraphLayout)
  const seed = useInspectorStore(s => s.bundleGraphSeed)

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

  return (
    <>
      <DriverControl
        driverNames={bundles.names}
        layout={layout}
        seed={seed}
        onChangeDriver={handleChangeBundleRenderer}
        onChangeLayout={handleChangeBundleLayout}
        onChangeSeed={handleChangeBundleSeed}
        {...props}
      />
      <ExportControl {...props} />
    </>
  )
}
