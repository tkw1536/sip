import { ComponentChild, Ref, h } from 'preact';
import { LibraryBasedRenderer, Size } from ".";
import Sigma from "sigma";
import Graph from "graphology";
import { Settings } from "sigma/dist/declarations/src/settings";
import { BundleEdge, BundleNode } from "../../../../lib/builders/bundle";
import forceAtlas2 from 'graphology-layout-forceatlas2';
import circular from 'graphology-layout/circular';

abstract class SigmaRenderer<NodeLabel, EdgeLabel> extends LibraryBasedRenderer<NodeLabel, EdgeLabel, Sigma, Graph> {
    protected abstract addNode(graph: Graph, id: number, node: NodeLabel): void;
    protected abstract addEdge(graph: Graph, from: number, to: number, edge: EdgeLabel): void;

    protected settings(): Partial<Settings> {
        return {
        };
    }

    protected beginSetup(container: HTMLElement, size: Size): Graph {
        return new Graph();
    }

    protected endSetup(graph: Graph, container: HTMLElement, size: Size, skipLayout?: boolean): Sigma {
        // setup an initial layout
        if (!skipLayout) {
            circular.assign(graph, {scale: 100});
        }

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
    protected endSetup(graph: Graph, container: HTMLElement, size: Size, skipLayout?: boolean): Sigma {
        circular.assign(graph, {scale: 100});
        forceAtlas2.assign(graph, {
            iterations: 500,
            settings: forceAtlas2.inferSettings(graph),
        });
        
        return super.endSetup(graph, container, size, true);
    }
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
            graph.addDirectedEdge(from, to, { color: 'black', type: 'arrow', arrow: 'target', size: 5});
            return;
        }
        if (edge.type === 'field') {
            graph.addDirectedEdge(from, to, { color: 'black', type: 'arrow', arrow: 'target',  size: 5});
            return;
        }
        throw new Error('never reached')
    }
}