import { h, Component, Fragment } from 'preact';
import type { ViewProps } from "../viewer";
import { bundles, models } from "../state/renderers";

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

        const bundleGraphName = bundleGraphRenderer.rendererName;
        const modelGraphName = modelGraphRenderer.rendererName;

        return <Fragment>
            <p>
                The graph views support multiple graph rendering backends.
                These are powered by different libraries and will look slightly different.
            </p>

            <p>
                Bundle Graph Renderer: &nbsp;
                <select value={bundleGraphName} onChange={this.onChangeBundleGraph}>
                    {
                        bundles.map(bundle => <option key={bundle.rendererName}>{bundle.rendererName}</option>)
                    }
                </select>
            </p>

            <p>
                Model Graph Renderer: &nbsp;
                <select value={modelGraphName} onChange={this.onChangeModelGraph}>
                    {
                        models.map(model => <option key={model.rendererName}>{model.rendererName}</option>)
                    }
                </select>
            </p>
        </Fragment>
    }
}