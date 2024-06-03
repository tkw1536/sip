import { h, Component, Fragment } from 'preact';
import type { ViewProps } from "../viewer";

export default class ExportView extends Component<ViewProps> {
    private export = (evt: MouseEvent) => {
        evt.preventDefault();

        const file = new Blob([this.props.data.toXML()], {'type': 'application/xml'});
        const url = URL.createObjectURL(file);

        const a = document.createElement("a");
        a.href = url;
        a.download = this.props.filename || 'pathbuilder.xml';
        document.body.appendChild(a);
        a.click();

        setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);  
        }, 0); 
    }
    render() {
        const { filename } = this.props;
        return <Fragment>
            <p>
                Use the button below to save the pathbuilder as an xml file.
                This usually corresponds to exactly the file that was originally loaded.
            </p>

            <button onClick={this.export}>Save {filename || "pathbuilder.xml"}</button>
        </Fragment>
    }
}