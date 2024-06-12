import { h, Component, Fragment } from 'preact';
import type { ViewProps } from "../viewer";
import { GraphRendererClass } from "./graph/renderers";
import { ModelEdge, ModelNode } from "../../lib/builders/model";
import { BundleEdge, BundleNode } from "../../lib/builders/bundle";
import { VisNetworkModelRenderer, VisNetworkBundleRenderer } from "./graph/renderers/vis-network";
import { SigmaBundleRenderer, SigmaModelRenderer } from "./graph/renderers/sigma";
import { CytoBundleRenderer, CytoModelRenderer } from "./graph/renderers/cytoscape";

export default class GraphConfigView extends Component<ViewProps> {
    private onChangeBundleGraph = (evt: Event & { currentTarget: HTMLSelectElement}) => {
        evt.preventDefault();
        const renderer = bundleRenderers.get(evt.currentTarget.value);
        if (!renderer) {
            return;
        }
        this.props.setBundleRenderer(renderer);
    }
    private onChangeModelGraph = (evt: Event & { currentTarget: HTMLSelectElement}) => {
        evt.preventDefault();
        const renderer = modelRenderers.get(evt.currentTarget.value);
        if (!renderer) {
            return;
        }
        this.props.setModelRenderer(renderer);
    }

    render() {
        const { bundleGraphRenderer, modelGraphRenderer } = this.props;

        const bundleGraphName = Array.from(bundleRenderers.entries()).find(([name, clz]) => clz === bundleGraphRenderer)?.[0]
        const modelGraphName = Array.from(modelRenderers.entries()).find(([name, clz]) => clz === modelGraphRenderer)?.[0]

        return <Fragment>
            <p>
                The graph views support multiple graph rendering backends.
                These are powered by different libraries and will look slightly different.
            </p>

            <p>
                Bundle Graph Renderer: &nbsp;
                <select value={bundleGraphName} onChange={this.onChangeBundleGraph}>
                    {
                        Array.from(bundleRenderers.keys()).map(name => <option key={name}>{name}</option>)
                    }
                </select>
            </p>

            <p>
                Model Graph Renderer: &nbsp;
                <select value={modelGraphName} onChange={this.onChangeModelGraph}>
                    {
                        Array.from(modelRenderers.keys()).map(name => <option key={name}>{name}</option>)
                    }
                </select>
            </p>
        </Fragment>
    }
}

const modelRenderers = new Map<string, GraphRendererClass<ModelNode, ModelEdge, any>>([
    ["vis-network", VisNetworkModelRenderer],
    ["sigma.js", SigmaModelRenderer],
    ["Cytoscape", CytoModelRenderer],
])
const bundleRenderers = new Map<string, GraphRendererClass<BundleNode, BundleEdge, any>>([
    ["vis-network", VisNetworkBundleRenderer],
    ["sigma.js", SigmaBundleRenderer],
    ["Cytoscape", CytoBundleRenderer]
])