import { h, Component, Fragment } from 'preact';
import type { ViewProps } from "../viewer";

export default class JSONView extends Component<ViewProps> {
    render() {
        return <Fragment>
            <h2>JSON View</h2>
            <p>
                This view displays the pathbuilder as JSON.
                Mostly useful for SIfP debugging, and not really for you.
            </p>
            <code>{JSON.stringify(this.props.data)}</code>
        </Fragment>
    }
}