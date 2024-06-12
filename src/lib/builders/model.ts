import GraphBuilder from ".";
import { Bundle, Field, PathTree } from "../pathtree";

export type Options = {
    include?(uri: string): boolean;
    deduplication?: Deduplication
}

export enum Deduplication {
    Full = 'full',
    Main = 'main',
    None = 'none',
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
    constructor(private tree: PathTree, private options: Options) {
        super();
    }

    /** checks if the given uri is included in the graph */
    private includes(uri: string): boolean {
        if (!this.options.include) return true;

        return this.options.include(uri);
    }
    
    protected doBuild(): void {
        switch(this.options.deduplication) {
            case Deduplication.Full:
                return this.doBuildFull();
            case Deduplication.None:
                return this.doBuildNone();
            default:
                console.warn('unimplemented mode');
                return;
        }
    }

    // #region "Full"
    protected doBuildFull() {
        this.tree.mainBundles.forEach(bundle => this.addBundleFull(bundle, 0));
    }

    private addBundleFull(bundle: Bundle, level: number): boolean {
        // add the node for this bundle
        const includeSelf = this.includes(bundle.path().id);

        if (includeSelf) {
            this.addBundleNodeFull(bundle, level);
        }

        // add all the child bundles
        bundle.childBundles.forEach(cb => {
            this.addBundleFull(cb, level + 1)
        });

        // add all the child fields
        bundle.childFields.forEach(cf => {
            const includeField = this.includes(cf.path().id);
            if (!includeField) return;

            this.addFieldFull(cf);
        })

        return includeSelf
    }

    private addBundleNodeFull(bundle: Bundle, level: number) {
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

    private addFieldFull(node: Field) {
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
    // #endregion

    // #region "None"
    protected doBuildNone() {
        this.tree.mainBundles.forEach(bundle => this.addBundleNone(null, bundle, 0));
        this.graph.definitelyAcyclic = true;
    }

    private addBundleNone(parentNode: number | null, bundle: Bundle, level: number): boolean {
        // add the node for this bundle
        const includeSelf = this.includes(bundle.path().id);

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
            const includeField = this.includes(cf.path().id);
            if (!includeField) return;

            this.addFieldNone(selfNode, cf);
        })

        return includeSelf
    }

    private addBundleNodeNone( bundle: Bundle, level: number): number | null {
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
        const displayParent = this.includes(parent?.path()?.id ?? '');
        if (parent && displayParent && typeof parentNode === 'number') {
            const length = parent.path()?.path_array?.length;
            if (typeof length === 'number' && length >= 0 && length % 2 == 0) {
                ownPath = ownPath.slice(length);
            }
        }
    
        // make a function to add a node
        const addNode = (i: number): number => {
            return this.graph.addNode({'type': 'class', clz: ownPath[i], bundles: new Set() });
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
    // #endregion
}

