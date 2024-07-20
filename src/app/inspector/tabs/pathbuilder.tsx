import {
  Component,
  type JSX,
  type ComponentChild,
  type ComponentChildren,
} from 'preact'
import DropArea from '../../../components/drop-area'
import * as styles from './pathbuilder.module.css'
import { type IReducerProps } from '../state'
import {
  loadPathbuilder,
  resetInspector,
  setPathbuilderLoading,
} from '../state/reducers'
import ErrorDisplay from '../../../components/error'
import download from '../../../lib/utils/download'
import { Type } from '../../../lib/utils/media'
import Spinner from '../../../components/spinner'

export default function PathbuilderTab(props: IReducerProps): JSX.Element {
  return props.state.loadStage === true ? (
    <InfoView {...props} />
  ) : (
    <WelcomeView {...props} />
  )
}

class WelcomeView extends Component<IReducerProps> {
  readonly #dragContent = (active: boolean, valid: boolean): ComponentChild => {
    switch (true) {
      case active && valid:
        return (
          <>
            <b>Release</b> to load <em>Pathbuilder</em>
          </>
        )
      case active && !valid:
        return (
          <>
            Invalid
            <em>Pathbuilder</em>: Must be a<b>xml</b> file
          </>
        )
      default:
        return (
          <>
            <b>Select</b> or <b>Drop</b> a <em>Pathbuilder</em> here
          </>
        )
    }
  }

  readonly #handleLoadPathbuilder = (file: File): void => {
    this.props.apply([setPathbuilderLoading, loadPathbuilder(file)])
  }

  render(): ComponentChild {
    const { loadStage } = this.props.state

    if (loadStage === 'loading') {
      return <Spinner message='Loading pathbuilder' />
    }

    return (
      <>
        <p>
          This tool provides an interface for inspecting{' '}
          <code>Pathbuilders</code> created by the{' '}
          <a
            href='https://wiss-ki.eu'
            target='_blank'
            rel='noopener noreferrer'
          >
            WissKI
          </a>{' '}
          software. Click below to load a pathbuilder.
        </p>
        <p>
          All processing happens on-device, meaning the server host can not
          access any data contained within your pathbuilder.
        </p>
        <DropArea
          class={styles.dropZone}
          activeValidClass={styles.valid}
          activeInvalidClass={styles.invalid}
          onDropFile={this.#handleLoadPathbuilder}
          types={[Type.XML]}
        >
          {this.#dragContent}
        </DropArea>
        {typeof loadStage === 'object' && loadStage.error instanceof Error && (
          <>
            <p>
              <b>Unable to load pathbuilder: </b>
            </p>
            <ErrorDisplay error={loadStage.error} />
          </>
        )}
      </>
    )
  }
}

class InfoView extends Component<IReducerProps> {
  readonly #handleClosePathbuilder = (evt: Event): void => {
    evt.preventDefault()
    this.props.apply(resetInspector)
  }

  readonly #handleExport = (evt: MouseEvent): void => {
    evt.preventDefault()

    const { pathbuilder } = this.props.state
    const file = new Blob([pathbuilder.toXML()], { type: 'application/xml' })
    download(file, this.filename)
  }

  get filename(): string {
    const { filename } = this.props.state
    return filename !== '' ? filename : 'pathbuilder.xml'
  }

  render(): ComponentChildren {
    return (
      <>
        <p>
          Pathbuilder{' '}
          <button onClick={this.#handleExport}>{this.filename}</button>{' '}
          successfully loaded. You can use the other tabs to inspect the
          pathbuilder.
        </p>
        <p>
          You can also close{' '}
          <button onClick={this.#handleClosePathbuilder}>Close</button> this
          pathbuilder.
        </p>
      </>
    )
  }
}
