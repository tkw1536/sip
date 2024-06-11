import { VisJsBundleRenderer } from "./renderers/visjs";
import GraphView from ".";
import BundleGraphBuilder, { BundleEdge, BundleNode } from "../../../lib/builders/bundle";
import { SigmaBundleRenderer } from "./renderers/sigma";

export default class BundleGraphView extends GraphView<BundleNode, BundleEdge, any> {
    protected getRenderer() {
        // return VisJsBundleRenderer;
        return SigmaBundleRenderer;
    }
    protected newGraphBuilder() {
        const { tree, selection } = this.props;
        return new BundleGraphBuilder(tree, selection);
    }
    protected renderPanel() {
        return null;
    }
}
