import { h, Component, Fragment, ComponentChild } from 'preact'
import DropArea from '../lib/components/drop-area'
import styles from './loader.module.css'

/**
 * Loader is responsible for providing an interface to load a pathbuilder.
 * The file should be passed to the callback.
 */
export default class Loader extends Component<{ error?: string, onLoad: (file: File) => void }> {
  private readonly dragContent = (active: boolean, valid: boolean): ComponentChild => {
    switch (true) {
      case active && valid:
        return <Fragment><b>Release</b> to load <em>Pathbuilder</em></Fragment>
      case active && !valid:
        return <Fragment>Invalid <em>Pathbuilder</em>: Must be a <b>xml</b> file</Fragment>
      default:
        return <Fragment><b>Select</b> or <b>Drop</b> a <em>Pathbuilder</em> here</Fragment>
    }
  }

  render (): ComponentChild {
    const { error, onLoad: handleChange } = this.props

    return (
      <Fragment>
        <p>
          This tool provides an interface for inspecting <code>Pathbuilders</code> created by the <a href='https://wiss-ki.eu' target='_blank' rel='noopener noreferrer'>WissKI</a> software.
          Click below to load a pathbuilder.
        </p>
        <p>
          All processing happens on-device, meaning the server host can not access any data contained within your pathbuilder.
        </p>
        {typeof error === 'string' ? <p><b>Error loading: </b><code>{error}</code></p> : null}
        <DropArea className={styles.dropZone} activeValidClassName={styles.valid} activeInvalidClassName={styles.invalid} onDropFile={handleChange} types={['text/xml']}>{this.dragContent}</DropArea>
      </Fragment>
    )
  }
}
