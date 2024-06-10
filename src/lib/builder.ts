import Graph from './graph';
import { Path } from "./pathbuilder";
import { Bundle, Field, NodeLike, PathTree } from "./pathtree";

export type Options = {
    include?(uri: string): boolean;
    deduplication?: Deduplication
}

export enum Deduplication {
    Full = 'full',
    Main = 'main',
}

type ModelNode = {
    /* represents a single class node */
    type: 'class',
    clz: string,

    /** bundles rooted at this node */
    bundles: Set<Bundle>,
} | {
    type: 'field',
    field: Field, /** the field at this path */
}

type ModelEdge = {
    /* represents a property between two class nodes */
    type: 'property',
    property: string,
} | {
    /** represents a datatype property */
    type: 'data',
    field: Field,
}

/** builds a new graph for a specific model */
export class GraphBuilder {
    constructor(private tree: PathTree, private options: Options) {
    }

    private includes(uri: string): boolean {
        if (!this.options.include) return true;

        return this.options.include(uri);
    }

    private done: boolean = false;
    private graph = new Graph<ModelNode, ModelEdge>();
    private tracker = new ArrayTracker<string>();
    
    public build(): typeof this.graph {

        // ensure that we're only called once!
        if (this.done) {
            return this.graph;
        }
        this.done = true;

        this.tree.mainBundles.forEach(bundle => this.addBundle(bundle, 0));

        // and return the graph;
        return this.graph;
    }

    private addBundleSelf(bundle: Bundle, level: number) {
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

    private addBundle(bundle: Bundle, level: number): boolean {
        // add the node for this bundle
        const includeSelf = this.includes(bundle.path().id);

        if (includeSelf) {
            this.addBundleSelf(bundle, level);
        }

        // add all the child bundles
        bundle.childBundles.forEach(cb => {
            this.addBundle(cb, level + 1)
        });

        // add all the child fields
        bundle.childFields.forEach(cf => {
            const includeField = this.includes(cf.path().id);
            if (!includeField) return;

            this.addField(cf);
        })

        return includeSelf
    }

    private addField(node: Field) {
        // get the actual path to add
        const path = node.path();
        if (!path) return;
    
        // find the path to include for this element
        let ownPath = path.path_array;
    
        // remove the parent path (if we've already added it)
        const parent = node.parent();
        const displayParent = this.includes(parent?.path()?.id ?? '');
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
                this.graph.addNode({'type': 'class', clz: node, bundles: new Set() }, node);
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

class ArrayTracker<T> {
    private equality: (l: T, r: T) => boolean;
    constructor(equality?: (left: T, right: T) => boolean) {
        this.equality = equality ?? ((l, r) => l === r);
    }

    private seen: T[][] = [];

    /** add adds element unless it is already there */
    add(element: T[]) {
        if (this.has(element)) return false; // don't add it again!
        this.seen.push(element.slice(0)); // add it!
        return true;
    }

    /** has checks if element is there  */
    has(element: T[]) {
        return this.index(element) >= 0;
    }
    private index(element: T[]): number {
        for (let i = 0; i < this.seen.length; i++) {
            const candidate = this.seen[i];
            if (candidate.length !== element.length) {
                continue;
            }

            let ok = true;
            for (let j = 0; j < candidate.length; j++) {
                if (!this.equality(candidate[j], element[j])) {
                    ok = false;
                    break;
                }
            }

            if (ok) { return i; }
        }
        return -1;
    }
}