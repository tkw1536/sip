import { BundleEdge, BundleNode } from "../../lib/builders/bundle";
import { ModelEdge, ModelNode } from "../../lib/builders/model"
import { GraphRendererClass } from "../views/graph/renderers"

class RendererCollection<R extends GraphRendererClass<NodeLabel, EdgeLabel, S>, NodeLabel, EdgeLabel, S> {
    constructor(public readonly defaultRenderer: string, ...all: Array<() => Promise<R>>) {
        this.all = all;
    }

    private map: Map<string, R> | null = null;
    private waiters: Array<() => void> = [];
    private all: Array<() => Promise<R>> | null = null;
    private buildMap(): Promise<Map<string, R>> {
        return new Promise(rs => {
            // map already exists
            if (this.map !== null) {
                rs(this.map);
                return;
            }

            // we are in waiting mode
            if (this.all === null) {
                this.waiters.push(() => {
                    rs(this.map!);
                })
                return;
            }

            // nothing is done yet => start the loading process
            Promise.all(this.all.map(e => e())).then((elements) => {
                const map = new Map<string, R>();
                elements.forEach(e => map.set(e.rendererName, e));
                this.map = map;

                // call the waiters, and remove them all
                this.waiters.forEach(callback => callback());
                this.waiters = [];

                rs(map);
            });
            this.all = null;
        });
    }

    public async get(name: string): Promise<R> {
        const elements = await this.buildMap();

        const element = elements.get(name);
        if (typeof element === 'undefined') {
            return Promise.reject('no such entry');
        }

        return Promise.resolve(element);
    }

    public names = async (): Promise<Array<string>> => {
        return this.buildMap().then(m => Array.from(m.keys()));
    }
}

export type ModelRenderer = GraphRendererClass<ModelNode, ModelEdge, any>;
export const models = new RendererCollection<ModelRenderer, ModelNode, ModelEdge, any>(
    "vis-network",
    async () => import("../views/graph/renderers/vis-network").then(m => m.VisNetworkModelRenderer),
    async () => import("../views/graph/renderers/sigma").then(m => m.SigmaModelRenderer),
    async () => import("../views/graph/renderers/cytoscape").then(m => m.CytoModelRenderer),
);

export type BundleRenderer = GraphRendererClass<BundleNode, BundleEdge, any>;
export const bundles = new RendererCollection<BundleRenderer, BundleNode, BundleEdge, any>(
    "vis-network",
    async () => import("../views/graph/renderers/vis-network").then(m => m.VisNetworkBundleRenderer),
    async () => import("../views/graph/renderers/sigma").then(m => m.SigmaBundleRenderer),
    async () => import("../views/graph/renderers/cytoscape").then(m => m.CytoBundleRenderer),
);