import GraphView from ".";
import GraphBuilder from "../../../lib/builders";
import BundleGraphBuilder, { BundleEdge, BundleNode } from "../../../lib/builders/bundle";
import { Bundle } from "../../../lib/pathtree";
import { BundleRenderer, bundles } from "../../state/renderers";

export default class BundleGraphView extends GraphView<BundleRenderer, BundleNode, BundleEdge, any> {
    protected readonly layoutKey = 'bundleGraphLayout';

    protected newRenderer(previousProps: typeof this.props): boolean {
        return this.props.bundleGraphRenderer != previousProps.bundleGraphRenderer;
    }
    protected makeRenderer(): Promise<BundleRenderer> {
        return bundles.get(this.props.bundleGraphRenderer);
    }
    protected makeGraphBuilder(): Promise<GraphBuilder<BundleNode, BundleEdge>> {
        const { tree, selection } = this.props;
        return Promise.resolve(new BundleGraphBuilder(tree, selection));
    }
    protected newGraphBuilder(previousProps: typeof this.props): boolean {
        return false;
    }
    protected renderPanel() {
        return null;
    }
}
