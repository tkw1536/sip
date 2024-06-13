import GraphBuilder, { ArrayTracker } from ".";
import Deduplication from "../../app/state/deduplication";
import Graph from "../graph";
import { Path } from "../pathbuilder";
import { Bundle, Field, PathTree } from "../pathtree";

export type Options = SharedOptions & {
    deduplication?: Deduplication
}

type SharedOptions = {
    include?(uri: string): boolean;
}


export type ModelNode = {
    /* represents a single class node */
    type: 'class',
    clz: string,

    /** bundles rooted at this node */
    bundles: Set<Bundle>,
} | {
    type: 'field',
    field: Field, /** the field at this path */
}

export type ModelEdge = {
    /* represents a property between two class nodes */
    type: 'property',
    property: string,
} | {
    /** represents a datatype property */
    type: 'data',
    field: Field,
}

/** builds a new graph for a specific model */
export default class ModelGraphBuilder extends GraphBuilder<ModelNode, ModelEdge> {
    private readonly specific: SpecificBuilder; 
    constructor(private tree: PathTree, private options: Options) {
        super();

        const { deduplication, ...specificOptions } = options;
        switch (this.options.deduplication) {
            case Deduplication.Full:
                this.specific = new FullBuilder(tree, specificOptions, this.graph);
                break;
            case Deduplication.None:
                this.specific = new NoneBuilder(tree, specificOptions, this.graph);
                break;
            case Deduplication.Bundle:
                this.specific = new BundleBuilder(tree, specificOptions, this.graph);
                break;
            default:
                throw new Error('unknown specific builder');
        } 

    }

    protected doBuild(): void {
       this.specific.build(); 
    }
}

abstract class SpecificBuilder {
    protected readonly tracker = new ArrayTracker<string>();
    constructor(public tree: PathTree, private options: SharedOptions, protected graph: Graph<ModelNode, ModelEdge>) {
    }

    public abstract build(): void;

    /** checks if the given uri is included in the graph */
    protected includes(withPath?: { path(): Path }): boolean {
        if (!this.options.include) return true;

        return this.options.include(withPath?.path()?.id ?? '');
    }
}

class NoneBuilder extends SpecificBuilder {
    public build() {
        this.tree.mainBundles.forEach(bundle => this.addBundleNone(null, bundle, 0));
        this.graph.definitelyAcyclic = true;
    }

    private addBundleNone(parentNode: number | null, bundle: Bundle, level: number): boolean {
        // add the node for this bundle
        const includeSelf = this.includes(bundle);

        let selfNode: number | null = null;
        if (includeSelf) {
            selfNode = this.addBundleNodeNone(bundle, level);
        }

        // add all the child bundles
        bundle.childBundles.forEach(cb => {
            this.addBundleNone(selfNode, cb, level + 1)
        });

        // add all the child fields
        bundle.childFields.forEach(cf => {
            const includeField = this.includes(cf);
            if (!includeField) return;

            this.addFieldNone(selfNode, cf);
        })

        return includeSelf
    }

    private addBundleNodeNone(bundle: Bundle, level: number): number | null {
        const path = bundle.path().path_array

        let index = path.length - 1;
        if (index % 2 !== 0) {
            console.warn('bundle of even length, ignoring last element', bundle);
            index--;
        }

        if (index < 0) {
            console.warn('bundle path has no elements', bundle);
            return null;
        }

        const clz = path[index];
        return this.graph.addNode({ type: 'class', clz, bundles: new Set([bundle]) });
    }

    private addFieldNone(parentNode: number | null, node: Field) {
        // get the actual path to add
        const path = node.path();
        if (!path) return;

        // find the path to include for this element
        let ownPath = path.path_array;

        // remove the parent path (if we've already added it)
        const parent = node.parent();
        const displayParent = this.includes(parent);
        if (parent && displayParent && typeof parentNode === 'number') {
            const length = parent.path()?.path_array?.length;
            if (typeof length === 'number' && length >= 0 && length % 2 == 0) {
                ownPath = ownPath.slice(length);
            }
        }

        // make a function to add a node
        const addNode = (i: number): number => {
            return this.graph.addNode({ 'type': 'class', clz: ownPath[i], bundles: new Set() });
        }

        // add all the parts of the node
        let prev = parentNode;
        if (!prev) {
            prev = addNode(0)
        }
        for (let i = 1; i + 1 < ownPath.length; i += 2) {
            const next = addNode(i + 1);
            const property = ownPath[i]
            this.graph.addEdge(prev, next, {
                'type': 'property',
                property,
            });
            prev = next;
        }

        // check if we have a datatype property 
        if (path.datatype_property == "") {
            return;
        }

        // add the datatype property (if any)
        const datatype = this.graph.addNode({
            type: 'field',
            field: node,
        });
        this.graph.addEdge(
            prev, datatype,
            {
                type: 'data',
                field: node,
            }
        );
    }
}

class BundleBuilder extends SpecificBuilder {
    public build() {
        // collect all the known contexts
        this.tree.mainBundles.forEach(bundle => this.collectContexts(bundle));

        // insert all the nodes
        this.tree.mainBundles.forEach(bundle => this.addBundle(bundle, 0));
        this.graph.definitelyAcyclic = true;
    }

    private contexts = new Set<string>();
    private collectContexts(bundle: Bundle) {
        bundle.childFields.forEach(field => {
            const disamb = field.path().getDisambiguation();
            if (disamb === null) return;
            this.contexts.add(disamb);
        })

        // iterate over children
        bundle.childBundles.forEach(bundle => this.collectContexts(bundle));

        // add the last subject of the path
        const path = bundle.path().path_array;
        let index = path.length - 1;
        if (index % 2 === 1) {
            index--;
        }
        if (index < 0) return;
        this.contexts.add(path[index]);
    }

    /** contextualizes an id before being used */
    private contextualize(context: string, id: string): string {
        return `context=${encodeURIComponent(context)}&uri=${encodeURIComponent(id)}`;
    }

    private addBundle(bundle: Bundle, level: number): boolean {
        // add a node for this bundle itself
        const includeSelf = this.includes(bundle);

        if (includeSelf) {
            this.addBundleNode(bundle, level);
        }

        // add all the child bundles
        bundle.childBundles.forEach(cb => {
            this.addBundle(cb, level + 1)
        });

        // add all the child fields
        bundle.childFields.forEach(cf => {
            const includeField = this.includes(cf);
            if (!includeField) return;

            this.addField(cf);
        })

        return includeSelf
    }
    
    /** adds a node for the currn*/
    private addBundleNode(bundle: Bundle, level: number): string {
        const path = bundle.path().path_array

        let index = path.length - 1;
        if (index % 2 !== 0) {
            console.warn('bundle of even length, ignoring last element', bundle);
            index--;
        }

        if (index < 0) {
            console.warn('bundle path has no elements', bundle);
            return '';
        }

        const clz = path[index];

        const id = this.contextualize(clz, clz)
        this.graph.addOrUpdateNode(id, (previous) => {
            if (previous?.type === 'field') {
                console.warn('uri used as both property and field', clz);
                return previous;
            }

            const bundles = new Set(previous?.bundles ?? []);
            bundles.add(bundle)
            return { 'type': 'class', clz: clz, bundles }
        });
        return id;
    }

    private addField(node: Field) {
        // get the actual path to add
        const path = node.path();
        if (!path) return;

        // find the path to include for this element
        let ownPath = path.path_array;

        // remove the parent path (if we've already added it)
        const parent = node.parent();
        const displayParent = this.includes(parent);
        
        if (parent && displayParent) {
            const length = parent.path()?.path_array?.length;
            if (typeof length === 'number' && length >= 0 && length % 2 == 0) {
                ownPath = ownPath.slice(length);
            }
        }

        // add a function to add the current context and node
        let currentContext: string = '';
        const addNodeIfNotExists = (i: number): string => {
            const clz = ownPath[i];
            if (this.contexts.has(clz)) {
                currentContext = clz;
            }

            const id = this.contextualize(currentContext, clz);
            if (!this.graph.hasNode(id)) {
                this.graph.addNode({ 'type': 'class', clz, bundles: new Set() }, id);
            }
            return id;
        }

        // add all the parts of the path
        let prev = addNodeIfNotExists(0)
        for (let i = 1; i + 1 < ownPath.length; i += 2) {
            const next = addNodeIfNotExists(i + 1);
            const property = ownPath[i]
            if (this.tracker.add([currentContext, prev, next, property])) {
                this.graph.addEdge(prev, next, {
                    'type': 'property',
                    property,
                });
            }
            prev = next;
        }

        // check if we have a datatype property 
        if (path.datatype_property == "") {
            return;
        }

        // add the datatype property (if any)
        const datatype = this.graph.addNode({
            type: 'field',
            field: node,
        });
        this.graph.addEdge(
            prev, datatype,
            {
                type: 'data',
                field: node,
            }
        );
    }
}

class FullBuilder extends SpecificBuilder {
    public build() {
        this.tree.mainBundles.forEach(bundle => this.addBundle(bundle, 0));
    }

    private addBundle(bundle: Bundle, level: number): boolean {
        // add the node for this bundle
        const includeSelf = this.includes(bundle);

        if (includeSelf) {
            this.addBundleNode(bundle, level);
        }

        // add all the child bundles
        bundle.childBundles.forEach(cb => {
            this.addBundle(cb, level + 1)
        });

        // add all the child fields
        bundle.childFields.forEach(cf => {
            const includeField = this.includes(cf);
            if (!includeField) return;

            this.addField(cf);
        })

        return includeSelf
    }

    private addBundleNode(bundle: Bundle, level: number) {
        const path = bundle.path().path_array

        let index = path.length - 1;
        if (index % 2 !== 0) {
            console.warn('bundle of even length, ignoring last element', bundle);
            index--;
        }

        if (index < 0) {
            console.warn('bundle path has no elements', bundle);
            return;
        }

        const clz = path[index];
        this.graph.addOrUpdateNode(clz, (previous) => {
            if (previous?.type === 'field') {
                console.warn('uri used as both property and field', clz);
                return previous;
            }

            const bundles = new Set(previous?.bundles ?? []);
            bundles.add(bundle)
            return { 'type': 'class', clz: clz, bundles }
        })
    }

    private addField(node: Field) {
        // get the actual path to add
        const path = node.path();
        if (!path) return;

        // find the path to include for this element
        let ownPath = path.path_array;

        // remove the parent path (if we've already added it)
        const parent = node.parent();
        const displayParent = this.includes(parent);
        if (parent && displayParent) {
            const length = parent.path()?.path_array?.length;
            if (typeof length === 'number' && length >= 0 && length % 2 == 0) {
                ownPath = ownPath.slice(length);
            }
        }

        // make a function to add a node
        const addNodeIfNotExists = (i: number): string => {
            const node = ownPath[i];

            if (!this.graph.hasNode(node)) {
                this.graph.addNode({ 'type': 'class', clz: node, bundles: new Set() }, node);
            }

            return node;
        }

        // add all the parts of the node
        let prev = addNodeIfNotExists(0)
        for (let i = 1; i + 1 < ownPath.length; i += 2) {
            const next = addNodeIfNotExists(i + 1);
            const property = ownPath[i]
            if (this.tracker.add([prev, next, property])) {
                this.graph.addEdge(prev, next, {
                    'type': 'property',
                    property,
                });
            }
            prev = next;
        }

        // check if we have a datatype property 
        if (path.datatype_property == "") {
            return;
        }

        // add the datatype property (if any)
        const datatype = this.graph.addNode({
            type: 'field',
            field: node,
        });
        this.graph.addEdge(
            prev, datatype,
            {
                type: 'data',
                field: node,
            }
        );
    }
}