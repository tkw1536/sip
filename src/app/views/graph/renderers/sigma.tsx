import { ComponentChild, Ref, h } from 'preact';
import { LibraryBasedRenderer, Size } from ".";
import Sigma from "sigma";
import Graph from "graphology";
import { Settings } from "sigma/dist/declarations/src/settings";
import { BundleEdge, BundleNode } from "../../../../lib/builders/bundle";
import forceAtlas2 from 'graphology-layout-forceatlas2';
import circular from 'graphology-layout/circular';
import circlepack from 'graphology-layout/circlepack';
import { ModelEdge, ModelNode } from "../../../../lib/builders/model";

abstract class SigmaRenderer<NodeLabel, EdgeLabel> extends LibraryBasedRenderer<NodeLabel, EdgeLabel, Sigma, Graph> {
    protected abstract addNode(graph: Graph, id: number, node: NodeLabel): void;
    protected abstract addEdge(graph: Graph, from: number, to: number, edge: EdgeLabel): void;

    static readonly supportedLayouts = ["force2atlas", "circular", "circlepack"];
    static readonly defaultLayout = this.supportedLayouts[0];

    protected settings(): Partial<Settings> {
        return {
        };
    }

    protected beginSetup(container: HTMLElement, size: Size): Graph {
        return new Graph();
    }

    protected endSetup(graph: Graph, container: HTMLElement, size: Size): Sigma {
        // determine the right layout
        switch (this.props.layout) {
            case "force2atlas":
                circular.assign(graph, { scale: 100 });
                forceAtlas2.assign(graph, {
                    iterations: 500,
                    settings: forceAtlas2.inferSettings(graph),
                });
                break;
            case "circlepack":
                circlepack.assign(graph);
                break;
            case "circular": /* fallthrough */
            default:
                circular.assign(graph, { scale: 100 });
        }
        // setup an initial layout
        
        

        const settings = this.settings();
        return new Sigma(graph, container, settings);
    }

    protected resizeObject(sigma: Sigma, graph: Graph, { width, height }: Size): void {
        sigma.resize();
        return; // automatically resized ?
    }

    protected destroyObject(sigma: Sigma, graph: Graph): void {
        sigma.kill();
    }

    protected objectToBlob(sigma: Sigma, graph: Graph, { width, height }: Size, type?: string, quality?: number): Promise<Blob> {
        return Promise.reject("not implemented");
    }

    protected renderDiv({ width, height }: Size, ref: Ref<HTMLDivElement>): ComponentChild {
        return <div ref={ref} style={{ width, height }} />;
    }
}

export class SigmaBundleRenderer extends SigmaRenderer<BundleNode, BundleEdge> {
    protected addNode(graph: Graph, id: number, node: BundleNode): void {
        if (node.type === 'bundle') {
            graph.addNode(id, { label: "Bundle\n" + node.bundle.path().name, color: 'blue', size: 20 });
            return;
        }
        if (node.type === 'field') {
            graph.addNode(id, { label: node.field.path().name, color: 'orange', size: 10 });
            return;
        }
        throw new Error('never reached');
    }
    protected addEdge(graph: Graph, from: number, to: number, edge: BundleEdge): void {
        if (edge.type === 'child_bundle') {
            graph.addDirectedEdge(from, to, { color: 'black', type: 'arrow', arrow: 'target', size: 5 });
            return;
        }
        if (edge.type === 'field') {
            graph.addDirectedEdge(from, to, { color: 'black', type: 'arrow', arrow: 'target', size: 5 });
            return;
        }
        throw new Error('never reached')
    }
}

export class SigmaModelRenderer extends SigmaRenderer<ModelNode, ModelEdge> {
    protected addNode(graph: Graph, id: number, node: ModelNode): void {
        const { ns } = this.props;
        if (node.type === 'field') {
            graph.addNode(id, {
                label: node.field.path().name,

                color: 'orange',
                size: 10,
            });
            return;
        }
        if (node.type === 'class' && node.bundles.size === 0) {
            graph.addNode(id, {
                label: ns.apply(node.clz),

                color: 'blue',
                size: 10,
            });
            return;
        }
        if (node.type === 'class' && node.bundles.size > 0) {
            const array_names = Array.from(node.bundles).map((bundle) => "Bundle " + bundle.path().name).join("\n\n");
            const label = ns.apply(node.clz) + "\n\n" + array_names;

            graph.addNode(id, {
                label,

                color: 'blue',
                size: 10,
            });
            return;
        }
    }
    protected addEdge(graph: Graph, from: number, to: number, edge: ModelEdge): void {
        if (edge.type === 'data') {
            graph.addDirectedEdge(from, to, { color: 'black', type: 'arrow', arrow: 'target', size: 5 });
            return;
        }
        if (edge.type === 'property') {
            graph.addDirectedEdge(from, to, { color: 'black', type: 'arrow', arrow: 'target', size: 5 });
            return;
        }
        throw new Error('never reached')
    }
}