import { h, Component, Fragment } from 'preact';
import type { ViewProps } from "../viewer";
import { download } from "../../lib/download";

export default class ExportView extends Component<ViewProps> {
    private export = (evt: MouseEvent) => {
        evt.preventDefault();

        const file = new Blob([this.props.pathbuilder.toXML()], {'type': 'application/xml'});
        download(file, this.props.filename || 'pathbuilder.xml');
    }
    render() {
        const { filename: filename } = this.props;
        return <Fragment>
            <p>
                Use the button below to save the pathbuilder as an xml file.
                This usually corresponds to exactly the file that was originally loaded.
            </p>

            <button onClick={this.export}>Save {filename || "pathbuilder.xml"}</button>
        </Fragment>
    }
}