import type { ElementDefinition, Core, CytoscapeOptions } from "cytoscape";
import cytoscape from "cytoscape";
import cola from "cytoscape-cola";
import dagre from "cytoscape-dagre";
import elk from "cytoscape-elk";
cytoscape.use(cola);
cytoscape.use(dagre);
cytoscape.use(elk);
import { LibraryBasedRenderer, Size } from ".";
import { BundleEdge, BundleNode } from "../../../../lib/builders/bundle";
import { ModelEdge, ModelNode } from "../../../../lib/builders/model";

type Elements = ElementDefinition[]
type Cytoscape = Core
type Options = Omit<CytoscapeOptions, "container" | "elements">;

abstract class CytoscapeRenderer<NodeLabel, EdgeLabel> extends LibraryBasedRenderer<NodeLabel, EdgeLabel, Cytoscape, Elements> {
    protected abstract addNode(elements: Elements, id: number, node: NodeLabel): void;
    protected abstract addEdge(elements: Elements, from: number, to: number, edge: EdgeLabel): void;

    protected layout(): Options["layout"] {
        return { name: 'dagre', padding: 100 } as unknown as any;
    }
    protected options(): Options {
        return {
            style: [
                {
                    selector: 'node',
                    style: {
                        label: 'data(label)',
                        'text-wrap': 'wrap',
                        color: 'data(color)'
                    }
                },
                {
                    selector: 'edge',
                    style: {
                        'width': 3,
                        'line-color': 'data(color)',
                        'target-arrow-color': 'data(color)',
                        'target-arrow-shape': 'triangle',
                        'curve-style': 'bezier'
                    }
                }
            ],
            layout: this.layout(),
        };
    }

    protected beginSetup(container: HTMLElement, size: Size): Elements {
        return [];
    }

    protected endSetup(elements: Elements, container: HTMLElement, size: Size): Cytoscape {
        const options = this.options();
        return cytoscape({
            container,
            elements,
            ...options,
        });
    }

    protected resizeObject(c: Cytoscape, elements: Elements, { width, height }: Size): void {
        c.resize();
        return; // automatically resized ?
    }

    protected destroyObject(c: Cytoscape, elements: Elements): void {
        c.destroy();
    }

    protected objectToBlob(c: Cytoscape, elements: Elements, { width, height }: Size, type?: string, quality?: number): Promise<Blob> {
        return Promise.reject("not implemented");
    }
}

export class CytoBundleRenderer extends CytoscapeRenderer<BundleNode, BundleEdge> {
    protected addNode(elements: Elements, id: number, node: BundleNode): void {
        const idStr = id.toString();
        if (node.type === 'bundle') {
            const label = "Bundle\n" + node.bundle.path().name
            const data = { id: idStr, label, color: 'blue' };
            elements.push({ data });
            return;
        }
        if (node.type === 'field') {
            const label = node.field.path().name;
            const data = { id: idStr, label, color: 'orange' };
            elements.push({ data });
            return;
        }
        throw new Error('never reached');
    }
    protected addEdge(elements: Elements, from: number, to: number, edge: BundleEdge): void {
        const fromStr = from.toString();
        const toStr = to.toString();
        const idStr = fromStr + "-" + toStr;

        if (edge.type === 'child_bundle') {
            const data = { id: idStr, source: fromStr, target: toStr, color: 'black' }
            elements.push({ data });
            return;
        }
        if (edge.type === 'field') {
            const data = { id: idStr, source: fromStr, target: toStr, color: 'black' }
            elements.push({ data });
            return;
        }
        throw new Error('never reached')
    }
}

export class CytoModelRenderer extends CytoscapeRenderer<ModelNode, ModelEdge> {
    protected layout(): Options["layout"] {
       return { name: 'elk', maxSimulationTime: 1000 * 1000} as unknown as any;
    }
    protected addNode(elements: Elements, id: number, node: ModelNode): void {
        const idStr = id.toString();
        const { ns } = this.props;
        if (node.type === 'field') {
            const data = { id: idStr, label: node.field.path().name, color: 'orange' };
            elements.push({ data })
            return;
        }
        if (node.type === 'class' && node.bundles.size === 0) {
            const data = { id: idStr, label: ns.apply(node.clz), color: 'blue' };
            elements.push({ data });
            return;
        }
        if (node.type === 'class' && node.bundles.size > 0) {
            const array_names = Array.from(node.bundles).map((bundle) => "Bundle " + bundle.path().name).join("\n\n");
            const label = ns.apply(node.clz) + "\n\n" + array_names;

            const data = { id: idStr, label, color: 'blue' };
            elements.push({ data });
            return;
        }
    }
    protected addEdge(elements: Elements, from: number, to: number, edge: ModelEdge): void {
        const { ns } = this.props;
        
        const fromStr = from.toString();
        const toStr = to.toString();
        const idStr = fromStr + "-" + toStr;

        if (edge.type === 'data') {
            const data = { id: idStr, source: fromStr, target: toStr, label: ns.apply(edge.field.path().datatype_property), color: 'black' }
            elements.push({ data })
            return;
        }
        if (edge.type === 'property') {
            const data = { id: idStr, source: fromStr, target: toStr, label: ns.apply(edge.property), color: 'black' }
            elements.push({ data });
            return;
        }
        throw new Error('never reached');
    }
}