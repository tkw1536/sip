import GraphView from ".";
import BundleGraphBuilder, { BundleEdge, BundleNode } from "../../../lib/builders/bundle";

export default class BundleGraphView extends GraphView<BundleNode, BundleEdge, any> {
    protected readonly layoutKey = 'bundleGraphLayout';
    protected getRenderer() {
        return this.props.bundleGraphRenderer;
    }
    protected newGraphBuilder() {
        const { tree, selection } = this.props;
        return new BundleGraphBuilder(tree, selection);
    }
    protected renderPanel() {
        return null;
    }
}
