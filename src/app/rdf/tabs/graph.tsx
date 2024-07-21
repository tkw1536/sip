import { Component, type ComponentChildren, createRef } from 'preact'
import { type RReducerProps } from '../state'
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

export default class GraphTab extends Component<RReducerProps> {
  readonly buildGraph = async (): Promise<Graph<RDFNode, RDFEdge>> => {
    const builder = new RDFGraphBuilder(this.props.state.store)
    return await builder.build()
  }

  readonly #handleChangeRDFRenderer = (value: string): void => {
    this.props.apply(setRDFDriver(value))
  }

  readonly #handleChangeRDFLayout = (value: string): void => {
    this.props.apply(setRDFLayout(value))
  }

  readonly #handleChangeRDFSeed = (seed: number | null): void => {
    this.props.apply(setRDFSeed(seed))
  }

  readonly #displayRef = createRef<GraphDisplay<RDFNode, RDFEdge, RDFOptions>>()

  readonly #handleResetDriver = (): void => {
    const { current: display } = this.#displayRef
    display?.remount()
  }

  render(): ComponentChildren {
    const {
      rdfGraphLayout,
      rdfGraphDriver,
      rdfGraphSeed,
      ns,
      namespaceVersion,
    } = this.props.state

    return (
      <GraphDisplay
        ref={this.#displayRef}
        loader={triples}
        driver={rdfGraphDriver}
        seed={rdfGraphSeed}
        builderKey={namespaceVersion.toString()}
        makeGraph={this.buildGraph}
        options={{ ns }}
        layout={rdfGraphLayout}
        panel={this.#renderPanel}
      />
    )
  }

  readonly #renderPanel = (
    driver: Driver<RDFNode, RDFEdge, RDFOptions> | null,
    animating: boolean | null,
  ): ComponentChildren => {
    const {
      state: { rdfGraphLayout, rdfGraphSeed },
    } = this.props

    return (
      <>
        <DriverControl
          driverNames={triples.names}
          driver={driver}
          seed={rdfGraphSeed}
          currentLayout={rdfGraphLayout}
          onChangeDriver={this.#handleChangeRDFRenderer}
          onChangeLayout={this.#handleChangeRDFLayout}
          onChangeSeed={this.#handleChangeRDFSeed}
          onResetDriver={this.#handleResetDriver}
          animating={animating}
        />
        <ExportControl driver={driver} display={this.#displayRef.current} />
      </>
    )
  }
}
