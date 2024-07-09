import { Component, type ComponentChildren, createRef } from 'preact'
import GraphDisplay, { Control, DriverControl, ExportControl } from '.'
import { triples } from '../../../../lib/drivers/collection'
import { type ReducerProps } from '../../../state'
import type Driver from '../../../../lib/drivers/impl'
import {
  setRDFDriver,
  setRDFLayout,
} from '../../../state/reducers/inspector/rdf'
import RDFGraphBuilder, {
  type RDFEdge,
  type RDFNode,
} from '../../../../lib/graph/builders/rdf'
import type Graph from '../../../../lib/graph'
import DropArea from '../../../../lib/components/drop-area'
import * as styles from './rdf.module.css'
import { graph, parse } from 'rdflib'
import { Type } from '../../../../lib/utils/media'

export default class RDFGraphView extends Component<
  ReducerProps,
  { data?: Blob }
> {
  state: { data?: Blob } = {}
  readonly #builder = async (): Promise<Graph<RDFNode, RDFEdge>> => {
    const { data } = this.state
    if (typeof data === 'undefined')
      throw new Error('tried to build a graph, but there is no blob')

    const text = await data.text()
    const format = 'application/rdf+xml'
    const base = '' // TODO: allow user to set this

    // parse in the graph
    const store = graph()
    parse(text, store, base, format)

    // create a builder and get the text ready
    const builder = new RDFGraphBuilder(store.close())
    return await builder.build()
  }

  readonly #handleClose = (evt: Event): void => {
    evt.preventDefault()
    this.setState({ data: undefined })
  }

  readonly #handleOpen = (file: File): void => {
    this.setState({ data: file })
  }

  readonly #displayRef = createRef<GraphDisplay<RDFNode, RDFEdge>>()

  render(): ComponentChildren {
    const { data } = this.state
    if (typeof data === 'undefined') {
      return this.renderLoad()
    }
    return this.renderView()
  }

  renderLoad(): ComponentChildren {
    return (
      <>
        <h2>RDF Visualizer</h2>
        <p>
          This is a really simple tool to render an actual RDF graph. It's not
          the primary purpose of this tool, but may be needed.
        </p>
        <DropArea
          class={styles.dropZone}
          activeValidClass={styles.valid}
          activeInvalidClass={styles.invalid}
          onDropFile={this.#handleOpen}
          types={[Type.XML]}
        >
          Drop <code>RDF/XML</code> here
        </DropArea>
      </>
    )
  }

  renderView(): ComponentChildren {
    const {
      rdfGraphLayout,
      rdfGraphDriver,
      pathbuilderVersion,
      selectionVersion,
      colorVersion,
      ns,
      cm,
    } = this.props.state

    return (
      <GraphDisplay
        ref={this.#displayRef}
        loader={triples}
        driver={rdfGraphDriver}
        builderKey={`${pathbuilderVersion}-${selectionVersion}-${colorVersion}`}
        makeGraph={this.#builder}
        ns={ns}
        cm={cm}
        layout={rdfGraphLayout}
        panel={this.#renderPanel}
      />
    )
  }

  readonly #handleChangeRDFRenderer = (value: string): void => {
    this.props.apply(setRDFDriver(value))
  }

  readonly #handleChangeRDFLayout = (value: string): void => {
    this.props.apply(setRDFLayout(value))
  }

  readonly #renderPanel = (
    driver: Driver<RDFNode, RDFEdge> | null,
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
        <Control name='Close'>
          <button onClick={this.#handleClose}>Close and Open Another</button>
        </Control>
        <ExportControl driver={driver} display={this.#displayRef.current} />
      </>
    )
  }
}
