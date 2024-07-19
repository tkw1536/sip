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
import { setRDFDriver, setRDFLayout } from '../state/reducers/rdf'
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

  readonly #displayRef = createRef<GraphDisplay<RDFNode, RDFEdge, RDFOptions>>()

  render(): ComponentChildren {
    const { rdfGraphLayout, rdfGraphDriver, ns, namespaceVersion } =
      this.props.state

    return (
      <GraphDisplay
        ref={this.#displayRef}
        loader={triples}
        driver={rdfGraphDriver}
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
  ): ComponentChildren => {
    const {
      state: { rdfGraphLayout },
    } = this.props

    return (
      <>
        <DriverControl
          driverNames={triples.names}
          driver={driver}
          currentLayout={rdfGraphLayout}
          onChangeDriver={this.#handleChangeRDFRenderer}
          onChangeLayout={this.#handleChangeRDFLayout}
        />
        <ExportControl driver={driver} display={this.#displayRef.current} />
      </>
    )
  }
}
