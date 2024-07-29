import { type JSX } from 'preact'
import GraphDisplay, {
  type PanelProps,
} from '../../../components/graph-display'
import {
  ControlGroup,
  DriverControl,
  ExportControl,
} from '../../../components/graph-display/controls'
import BundleGraphBuilder, {
  type BundleOptions,
  type BundleEdge,
  type BundleNode,
} from '../../../lib/graph/builders/bundle'
import { bundles } from '../../../lib/drivers/collection'

import type Graph from '../../../lib/graph'
import { useMemo } from 'preact/hooks'
import useInspectorStore from '../state'

export default function BundleGraphTab(): JSX.Element {
  const tree = useInspectorStore(s => s.pathtree)
  const selection = useInspectorStore(s => s.selection)
  const driver = useInspectorStore(s => s.bundleGraphDriver)
  const layout = useInspectorStore(s => s.bundleGraphLayout)
  const seed = useInspectorStore(s => s.bundleSeed)
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
  const layout = useInspectorStore(s => s.bundleGraphLayout)
  const seed = useInspectorStore(s => s.bundleSeed)

  const setDriver = useInspectorStore(s => s.setBundleDriver)
  const setLayout = useInspectorStore(s => s.setBundleLayout)
  const setSeed = useInspectorStore(s => s.setBundleSeed)

  return (
    <ControlGroup>
      <DriverControl
        driverNames={bundles.names}
        layout={layout}
        seed={seed}
        onChangeDriver={setDriver}
        onChangeLayout={setLayout}
        onChangeSeed={setSeed}
        {...props}
      />
      <ExportControl {...props} />
    </ControlGroup>
  )
}
