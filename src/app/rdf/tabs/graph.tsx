import { type JSX } from 'preact'
import GraphDisplay, {
  type PanelProps,
} from '../../../components/graph-display'
import {
  DriverControl,
  ExportControl,
} from '../../../components/graph-display/controls'
import RDFGraphBuilder, {
  type RDFOptions,
  type RDFEdge,
  type RDFNode,
} from '../../../lib/graph/builders/rdf'
import type Graph from '../../../lib/graph'
import { triples } from '../../../lib/drivers/collection'
import useRDFStore from '../state'
import { useMemo } from 'preact/hooks'

export default function GraphTab(): JSX.Element {
  const store = useRDFStore(s => s.store)
  const layout = useRDFStore(s => s.rdfGraphLayout)
  const driver = useRDFStore(s => s.rdfGraphDriver)
  const seed = useRDFStore(s => s.rdfGraphSeed)
  const ns = useRDFStore(s => s.ns)

  const makeGraph = useMemo(
    () => async (): Promise<Graph<RDFNode, RDFEdge>> => {
      const builder = new RDFGraphBuilder(store)
      return builder.build()
    },
    [store],
  )

  return (
    <GraphDisplay
      loader={triples}
      name={driver}
      seed={seed}
      makeGraph={makeGraph}
      options={{ ns }}
      layout={layout}
      panel={GraphTabPanel}
    />
  )
}

function GraphTabPanel(
  props: PanelProps<RDFNode, RDFEdge, RDFOptions, never>,
): JSX.Element {
  const setDriver = useRDFStore(s => s.setRDFDriver)

  const layout = useRDFStore(s => s.rdfGraphLayout)
  const setLayout = useRDFStore(s => s.setRDFLayout)

  const seed = useRDFStore(s => s.rdfGraphSeed)
  const setSeed = useRDFStore(s => s.setRDFSeed)

  return (
    <>
      <DriverControl
        driverNames={triples.names}
        layout={layout}
        seed={seed}
        onChangeDriver={setDriver}
        onChangeLayout={setLayout}
        onChangeSeed={setSeed}
        {...props}
      />
      <ExportControl {...props} />
    </>
  )
}
