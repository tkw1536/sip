import { h, Component, Fragment } from 'preact';
import type { ViewProps } from "../viewer";
import { bundles, getBundleName, getModelName, models } from "../state/renderers";

export default class GraphConfigView extends Component<ViewProps> {
    private onChangeBundleGraph = (evt: Event & { currentTarget: HTMLSelectElement}) => {
        evt.preventDefault();
        const renderer = bundles.get(evt.currentTarget.value);
        if (!renderer) {
            return;
        }
        this.props.setBundleRenderer(renderer);
    }
    private onChangeModelGraph = (evt: Event & { currentTarget: HTMLSelectElement}) => {
        evt.preventDefault();
        const renderer = models.get(evt.currentTarget.value);
        if (!renderer) {
            return;
        }
        this.props.setModelRenderer(renderer);
    }

    render() {
        const { bundleGraphRenderer, modelGraphRenderer } = this.props;

        const bundleGraphName = getBundleName(bundleGraphRenderer)
        const modelGraphName = getModelName(modelGraphRenderer)

        return <Fragment>
            <p>
                The graph views support multiple graph rendering backends.
                These are powered by different libraries and will look slightly different.
            </p>

            <p>
                Bundle Graph Renderer: &nbsp;
                <select value={bundleGraphName} onChange={this.onChangeBundleGraph}>
                    {
                        Array.from(bundles.keys()).map(name => <option key={name}>{name}</option>)
                    }
                </select>
            </p>

            <p>
                Model Graph Renderer: &nbsp;
                <select value={modelGraphName} onChange={this.onChangeModelGraph}>
                    {
                        Array.from(models.keys()).map(name => <option key={name}>{name}</option>)
                    }
                </select>
            </p>
        </Fragment>
    }
}