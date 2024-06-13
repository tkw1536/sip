import { BundleEdge, BundleNode } from "../../lib/builders/bundle";
import { ModelEdge, ModelNode } from "../../lib/builders/model"
import { GraphRendererClass } from "../views/graph/renderers"
import { CytoBundleRenderer, CytoModelRenderer } from "../views/graph/renderers/cytoscape";
import { SigmaBundleRenderer, SigmaModelRenderer } from "../views/graph/renderers/sigma";
import { VisNetworkBundleRenderer, VisNetworkModelRenderer } from "../views/graph/renderers/vis-network";

export type ModelRenderer = GraphRendererClass<ModelNode, ModelEdge, any>;
export type BundleRenderer = GraphRendererClass<BundleNode, BundleEdge, any>;

export const defaultModel: ModelRenderer = CytoModelRenderer;
export const models = new Map<string, ModelRenderer>([
    ["vis-network", VisNetworkModelRenderer],
    ["sigma.js", SigmaModelRenderer],
    ["Cytoscape", CytoModelRenderer],
])

export const defaultBundle: BundleRenderer = VisNetworkBundleRenderer;
export const bundles = new Map<string, BundleRenderer>([
    ["vis-network", VisNetworkBundleRenderer],
    ["sigma.js", SigmaBundleRenderer],
    ["Cytoscape", CytoBundleRenderer]
])