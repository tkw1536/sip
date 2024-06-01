import { h, Component, Fragment } from 'preact';
import { FileUploader } from 'react-drag-drop-files';

/**
 * Loader is responsible for providing an interface to load a pathbuilder.
 * The file should be passed to the callback.
 */
export default class Loader extends Component<{error?: string, onLoad: (file: File) => void}> {
    render() {
        const { error } = this.props;

        return <Fragment>
            <p>
                This tool provides an interface for inspecting <code>Pathbuilders</code> created by the <a href="https://wiss-ki.eu" target="_blank" rel="noopener noreferrer">WissKI</a> software.
                Click below to load a pathbuilder.
            </p>
            <p>
                All processing happens on-device, meaning the server host can not access any data contained within your pathbuilder. 
            </p>
            { typeof error === 'string' ? <p><b>Error loading: </b><code>{error}</code></p> : null}
            <FileUploader handleChange={this.props.onLoad} label="Select or drop a pathbuilder here" types={["XML"]} />
        </Fragment>
    }
}