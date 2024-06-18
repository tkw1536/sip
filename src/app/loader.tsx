import { h, Component, Fragment, ComponentChild } from 'preact'
import DropArea from '../lib/components/drop-area'
import styles from './loader.module.css'

/**
 * Loader is responsible for providing an interface to load a pathbuilder.
 * The file should be passed to the callback.
 */
export default class Loader extends Component<{ error?: string, onLoad: (file: File) => void }> {
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
        <DropArea className={styles.dropZone} activeClassName={styles.active} onDropFile={handleChange} types={['XML']}>Select or drop a pathbuilder here</DropArea>
      </Fragment>
    )
  }
}
