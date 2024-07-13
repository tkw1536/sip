import { Component, type ComponentChildren, createRef } from 'preact'
import GraphDisplay, { Control, DriverControl, ExportControl } from '.'
import { triples } from '../../../../../lib/drivers/collection'
import { type ReducerProps } from '../../../state'
import type Driver from '../../../../../lib/drivers/impl'
import {
  setRDFDriver,
  setRDFLayout,
} from '../../../state/reducers/inspector/rdf'
import RDFGraphBuilder, {
  type RDFEdge,
  type RDFNode,
} from '../../../../../lib/graph/builders/rdf'
import type Graph from '../../../../../lib/graph'
import DropArea from '../../../../../lib/components/drop-area'
import * as styles from './rdf.module.css'
import { graph, parse, type Store } from 'rdflib'
import NamespaceEditor from '../../../../../lib/components/namespace-editor'
import { NamespaceMap } from '../../../../../lib/pathbuilder/namespace'
import { Operation } from '../../../../../lib/utils/operation'
import ErrorDisplay from '../../../../../lib/components/error'
import { type Term } from 'rdflib/lib/tf-types'

export default class RDFGraphView extends Component<
  ReducerProps,
  { loadError?: any; store?: Store; fileName?: string }
> {
  state: { loadError?: any; store?: Store; fileName?: string } = {}

  readonly #handleClose = (): void => {
    this.setState({ store: undefined, fileName: undefined })
  }

  readonly #operation = new Operation()
  readonly #handleOpen = (file: File): void => {
    const ticket = this.#operation.ticket()
    this.#loadFile(file).then(
      ({ store, fileName }) => {
        this.setState(() => {
          if (!ticket()) return null
          return { store, fileName, loadError: undefined }
        })
      },
      loadError => {
        this.setState(() => {
          if (!ticket()) return null
          return { store: undefined, fileName: undefined, loadError }
        })
      },
    )
    void file.text().then(text => {
      this.setState(() => {
        if (!ticket()) return null
        return { fileText: text, fileName: file.name }
      })
    })
  }

  async #loadFile(file: File): Promise<{ store: Store; fileName: string }> {
    const text = await file.text()
    const { name } = file

    const format = 'application/rdf+xml'
    const base = 'file://' + (name !== '' ? name : 'upload.xml') // TODO: allow user to set this

    // parse in the graph
    const store = graph()
    parse(text, store, base, format)

    return { store: store.close(), fileName: name }
  }

  componentWillUnmount(): void {
    this.#operation.cancel()
  }

  render(): ComponentChildren {
    const { store, fileName, loadError } = this.state

    // file loaded => display it
    if (
      typeof loadError === 'undefined' &&
      typeof store !== 'undefined' &&
      typeof fileName !== 'undefined'
    ) {
      return (
        <RDFGraphDisplay
          store={store}
          fileName={fileName}
          onClose={this.#handleClose}
          {...this.props}
        />
      )
    }

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
        >
          Drop <code>RDF/XML</code> here
        </DropArea>
        {typeof loadError !== 'undefined' && <ErrorDisplay error={loadError} />}
      </>
    )
  }
}

interface GraphDisplayState {
  ns: NamespaceMap
  nsKey: number
}

class RDFGraphDisplay extends Component<
  {
    store: Store
    fileName: string
    onClose: () => void
  } & ReducerProps,
  GraphDisplayState
> {
  readonly #displayRef = createRef<GraphDisplay<RDFNode, RDFEdge>>()

  /** generates a namespace map from the props */
  readonly #generateNS = (): NamespaceMap => {
    const uris = new Set<string>()
    const addTerm = (term: Term): void => {
      if (term.termType !== 'NamedNode') return
      uris.add(term.value)
    }
    this.props.store.statements.forEach(statement => {
      addTerm(statement.subject)
      addTerm(statement.predicate)
      addTerm(statement.object)
    })
    return NamespaceMap.generate(uris)
  }
  state: GraphDisplayState = {
    ns: this.#generateNS(),
    nsKey: 0,
  }

  readonly buildGraph = async (): Promise<Graph<RDFNode, RDFEdge>> => {
    const builder = new RDFGraphBuilder(this.props.store)
    return await builder.build()
  }

  readonly #handleChangeRDFRenderer = (value: string): void => {
    this.props.apply(setRDFDriver(value))
  }

  readonly #handleChangeRDFLayout = (value: string): void => {
    this.props.apply(setRDFLayout(value))
  }

  render(): ComponentChildren {
    const { rdfGraphLayout, rdfGraphDriver, cm } = this.props.state

    const { ns, nsKey } = this.state

    return (
      <GraphDisplay
        ref={this.#displayRef}
        loader={triples}
        driver={rdfGraphDriver}
        builderKey={nsKey.toString()}
        makeGraph={this.buildGraph}
        ns={ns}
        cm={cm}
        layout={rdfGraphLayout}
        panel={this.#renderPanel}
      />
    )
  }

  readonly #handleResetNS = (): void => {
    this.setState(({ nsKey }) => ({
      ns: this.#generateNS(),
      nsKey: nsKey + 1,
    }))
  }
  readonly #handleSetNS = (ns: NamespaceMap): void => {
    this.setState(({ nsKey }) => ({
      ns,
      nsKey: nsKey + 1,
    }))
  }

  readonly #renderPanel = (
    driver: Driver<RDFNode, RDFEdge> | null,
  ): ComponentChildren => {
    const {
      state: { rdfGraphLayout },
    } = this.props

    const { ns, nsKey } = this.state

    return (
      <>
        <DriverControl
          driverNames={triples.names}
          driver={driver}
          currentLayout={rdfGraphLayout}
          onChangeDriver={this.#handleChangeRDFRenderer}
          onChangeLayout={this.#handleChangeRDFLayout}
        />
        <Control name='Namespace Map'>
          <NamespaceEditor
            ns={ns}
            nsKey={nsKey}
            onUpdate={this.#handleSetNS}
            onReset={this.#handleResetNS}
          ></NamespaceEditor>
        </Control>
        <Control name='Close'>
          <button onClick={this.props.onClose}>Close and Open Another</button>
        </Control>
        <ExportControl driver={driver} display={this.#displayRef.current} />
      </>
    )
  }
}
