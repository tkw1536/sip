import { h, Component, Fragment } from 'preact';
import type { ViewProps } from "../viewer";

export default class XMLView extends Component<ViewProps> {
    render() {
        return <Fragment>
            <h2>XML View</h2>
            <p>
                This view displays the pathbuilder as XML.
            </p>
            (not yet implemented)
        </Fragment>
    }
}