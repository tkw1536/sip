import { Component, type ComponentChildren, type VNode } from 'preact'
import { type RReducerProps } from '../state'
import { loadRDF, setStoreLoading } from '../state/reducers/load'
import { Loader } from '../../../components/loader/loader'
import * as styles from './rdf.module.css'
import DropArea from '../../../components/drop-area'
import ErrorDisplay from '../../../components/error'
import { resetRDFInterface } from '../state/reducers/init'

export default function RDFTab(props: RReducerProps): VNode<any> {
  if (props.state.loadStage === true) {
    return <InfoView {...props} />
  } else {
    return <WelcomeView {...props} />
  }
}

class WelcomeView extends Component<RReducerProps> {
  readonly #handleLoadPathbuilder = (file: File): void => {
    this.props.apply([setStoreLoading, loadRDF(file)])
  }

  render(): ComponentChildren {
    const { loadStage } = this.props.state

    if (loadStage === 'loading') {
      return <Loader message='Loading RDF' />
    }

    return (
      <>
        <p>This tool provides an interface for visualizing rdf files.</p>
        <p>
          All processing happens on-device, meaning the server host can not
          access any data contained within your statements.
        </p>
        <DropArea
          class={styles.dropZone}
          activeValidClass={styles.valid}
          activeInvalidClass={styles.invalid}
          onDropFile={this.#handleLoadPathbuilder}
        >
          Click or drag an <code>RDF/XML</code> file here
        </DropArea>
        {typeof loadStage === 'object' && loadStage.error instanceof Error && (
          <>
            <p>
              <b>Unable to load rdf: </b>
            </p>
            <ErrorDisplay error={loadStage.error} />
          </>
        )}
      </>
    )
  }
}

class InfoView extends Component<RReducerProps> {
  readonly #handleClose = (evt: Event): void => {
    evt.preventDefault()
    this.props.apply(resetRDFInterface)
  }

  get filename(): string {
    const { filename } = this.props.state
    return filename !== '' ? filename : 'statements.rdf'
  }

  render(): ComponentChildren {
    return (
      <>
        <p>
          RDF <code>{this.filename}</code> successfully loaded.
        </p>
        <p>
          You can also <button onClick={this.#handleClose}>Close</button> this
          file.
        </p>
      </>
    )
  }
}
