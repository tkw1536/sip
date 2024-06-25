import { Component, ComponentChild, ComponentChildren } from 'preact'
import DropArea from '../../lib/components/drop-area'
import * as styles from './pathbuilder.module.css'
import { ReducerProps } from '../state'
import { loaderPathbuilder, resetInterface } from '../state/reducers/init'
import ErrorDisplay from '../../lib/components/error'
import { formatXML } from '../../lib/drivers/impl'

export default class PathbuilderView extends Component<ReducerProps> {
  private readonly dragContent = (active: boolean, valid: boolean): ComponentChild => {
    switch (true) {
      case active && valid:
        return <><b>Release</b> to load <em>Pathbuilder</em></>
      case active && !valid:
        return <>Invalid <em>Pathbuilder</em>: Must be a <b>xml</b> file</>
      default:
        return <><b>Select</b> or <b>Drop</b> a <em>Pathbuilder</em> here</>
    }
  }

  private readonly handleLoadPathbuilder = (file: File): void => {
    this.props.apply(loaderPathbuilder(file))
  }

  private readonly handleClosePathbuilder = (evt: Event): void => {
    evt.preventDefault()
    this.props.apply(resetInterface)
  }

  render (): ComponentChildren {
    if (this.props.state.loaded === true) {
      return this.renderInfo()
    }
    return this.renderLoader()
  }

  private renderLoader (): ComponentChild {
    const { loaded: error } = this.props.state

    return (
      <>
        <p>
          This tool provides an interface for inspecting <code>Pathbuilders</code> created by the <a href='https://wiss-ki.eu' target='_blank' rel='noopener noreferrer'>WissKI</a> software.
          Click below to load a pathbuilder.
        </p>
        <p>
          All processing happens on-device, meaning the server host can not access any data contained within your pathbuilder.
        </p>
        <DropArea class={styles.dropZone} activeValidClass={styles.valid} activeInvalidClass={styles.invalid} onDropFile={this.handleLoadPathbuilder} types={[formatXML]}>{this.dragContent}</DropArea>
        {typeof error !== 'boolean' && error.error instanceof Error && (
          <>
            <p><b>Unable to load pathbuilder: </b></p>
            <ErrorDisplay error={error.error} />
          </>
        )}
      </>
    )
  }

  private renderInfo (): ComponentChildren {
    return (
      <>
        <p>
          To close this pathbuilder click the following button.
          You can also just close this tab.
        </p>
        <p>
          <button onClick={this.handleClosePathbuilder}>Close</button>
        </p>
      </>
    )
  }
}
