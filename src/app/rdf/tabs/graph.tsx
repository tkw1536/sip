import { type JSX, type RefObject } from 'preact'
import GraphDisplay, {
  DriverControl,
  ExportControl,
} from '../../../components/graph-display'
import RDFGraphBuilder, {
  type RDFOptions,
  type RDFEdge,
  type RDFNode,
} from '../../../lib/graph/builders/rdf'
import { setRDFDriver, setRDFLayout, setRDFSeed } from '../state/reducers/rdf'
import type Graph from '../../../lib/graph'
import type Driver from '../../../lib/drivers/impl'
import { triples } from '../../../lib/drivers/collection'
import { useRDFStore } from '../state'
import { useCallback, useMemo, useRef } from 'preact/hooks'

export default function GraphTab(): JSX.Element {
  const store = useRDFStore(s => s.store)
  const layout = useRDFStore(s => s.rdfGraphLayout)
  const driver = useRDFStore(s => s.rdfGraphDriver)
  const seed = useRDFStore(s => s.rdfGraphSeed)
  const ns = useRDFStore(s => s.ns)
  const nsVersion = useRDFStore(s => s.namespaceVersion)

  const makeGraph = useMemo(
    () => async (): Promise<Graph<RDFNode, RDFEdge>> => {
      const builder = new RDFGraphBuilder(store)
      return await builder.build()
    },
    [RDFGraphBuilder, store],
  )

  const displayRef =
    useRef<GraphDisplay<RDFNode, RDFEdge, RDFOptions, never>>(null)

  const panel = useCallback(
    (
      driver: GraphTabPanelProps['driver'],
      animating: GraphTabPanelProps['animating'],
    ) => (
      <GraphTabPanel
        driver={driver}
        animating={animating}
        displayRef={displayRef}
      />
    ),
    [GraphTabPanel, displayRef],
  )
  return (
    <GraphDisplay
      ref={displayRef}
      loader={triples}
      driver={driver}
      seed={seed}
      builderKey={nsVersion.toString()}
      makeGraph={makeGraph}
      options={{ ns }}
      layout={layout}
      panel={panel}
    />
  )
}

interface GraphTabPanelProps {
  animating: boolean
  driver: Driver<RDFNode, RDFEdge, RDFOptions, never> | null
  displayRef: RefObject<GraphDisplay<RDFNode, RDFEdge, RDFOptions, never>>
}

function GraphTabPanel(props: GraphTabPanelProps): JSX.Element {
  const apply = useRDFStore(s => s.apply)

  const rdfGraphSeed = useRDFStore(s => s.rdfGraphSeed)
  const rdfGraphLayout = useRDFStore(s => s.rdfGraphLayout)

  const { driver, animating, displayRef } = props

  const handleChangeRDFDriver = useCallback(
    (driver: string): void => {
      apply(setRDFDriver(driver))
    },
    [apply, setRDFDriver],
  )

  const handleChangeRDFLayout = useCallback(
    (value: string): void => {
      apply(setRDFLayout(value))
    },
    [apply, setRDFLayout],
  )

  const handleResetDriver = useCallback((): void => {
    displayRef.current?.remount()
  }, [displayRef.current])

  const handleChangeRDFSeed = useCallback(
    (seed: number | null): void => {
      apply(setRDFSeed(seed))
    },
    [apply, setRDFSeed],
  )

  return (
    <>
      <DriverControl
        driverNames={triples.names}
        driver={driver}
        seed={rdfGraphSeed}
        currentLayout={rdfGraphLayout}
        onChangeDriver={handleChangeRDFDriver}
        onChangeLayout={handleChangeRDFLayout}
        onChangeSeed={handleChangeRDFSeed}
        onResetDriver={handleResetDriver}
        animating={animating}
      />
      <ExportControl driver={driver} display={displayRef.current} />
    </>
  )
}
/*
  readonly #renderPanel = (
    driver: Driver<RDFNode, RDFEdge, RDFOptions, never> | null,
    animating: boolean | null,
  ): ComponentChildren => {
    
  }
}
*/
