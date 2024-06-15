import { BundleEdge, BundleNode } from "../../lib/builders/bundle";
import { ModelEdge, ModelNode } from "../../lib/builders/model"
import { GraphRendererClass } from "../views/graph/renderers"
import { CytoBundleRenderer, CytoModelRenderer } from "../views/graph/renderers/cytoscape";
import { SigmaBundleRenderer, SigmaModelRenderer } from "../views/graph/renderers/sigma";
import { VisNetworkBundleRenderer, VisNetworkModelRenderer } from "../views/graph/renderers/vis-network";

class RendererCollection<R extends GraphRendererClass<NodeLabel, EdgeLabel, S>, NodeLabel, EdgeLabel, S> {
    private elements = new Map<string, R>();

    public getDefault(): R {
        return this.dflt;
    }
    private readonly dflt: R; 
    constructor(dflt: number, ...all: Array<R>){
        all.forEach(clz => this.elements.set(clz.rendererName, clz));
        if (all.length <= dflt) {
            throw new Error('RendererCollection: default index too small');
        }
        this.dflt = all[dflt];
        
    }

    public get(name: string): R | null{
        return this.elements.get(name) ?? null;
    }

    public map<T>(callback: (clz: R) => T): Array<T> {
        return Array.from(this.elements).map(([_, clz]) => callback(clz));
    }
}

export type ModelRenderer = GraphRendererClass<ModelNode, ModelEdge, any>;
export const models = new RendererCollection<ModelRenderer, ModelNode, ModelEdge, any>(
    0,
    VisNetworkModelRenderer,
    SigmaModelRenderer,
    CytoModelRenderer, 
);

export type BundleRenderer = GraphRendererClass<BundleNode, BundleEdge, any>;
export const bundles = new RendererCollection<BundleRenderer, BundleNode, BundleEdge, any>(
    0,
    VisNetworkBundleRenderer,
    SigmaBundleRenderer,
    CytoBundleRenderer,
);