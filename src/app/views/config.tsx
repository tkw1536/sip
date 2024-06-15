import { h, Component, Fragment } from 'preact';
import type { ViewProps } from "../viewer";
import { bundles, models } from "../state/renderers";
import AsyncArraySelector from "../../lib/async-array-selector";

export default class GraphConfigView extends Component<ViewProps> {
    render() {
        const { bundleGraphRenderer, modelGraphRenderer } = this.props;

        return <Fragment>
            <p>
                The graph views support multiple graph rendering backends.
                These are powered by different libraries and will look slightly different.
            </p>

            <p>
                Bundle Graph Renderer: &nbsp;
                <AsyncArraySelector value={bundleGraphRenderer} onChange={this.props.setBundleRenderer} load={bundles.names}/>
            </p>

            <p>
                Model Graph Renderer: &nbsp;
                <AsyncArraySelector onChange={this.props.setModelRenderer} value={modelGraphRenderer} load={models.names} />
            </p>
        </Fragment>
    }
}

