/** Graph implements a generic directed graph */
class Graph {
    constructor() {}

    private nodes = new Map<number, Set<string>>()
    private edges = new Map<number, Map<number, Set<string>>>();
    private ids = new IDMap<string>();


    /** addNode adds a new Node with the given labels */
    addNode(id?: string, ...labels: string[]): number {
        const theId = (typeof id === 'string') ? this.ids.getOrCreate(id) : this.ids.next();
        
        let set = this.nodes.get(theId);
        if (!set) {
            set = new Set<string>();
            this.nodes.set(theId, set);
        }

        labels.forEach(label => set.add(label))

        return theId;
    }

    /** getOrAddNode adds a new node with the given id */
    getOrAddNode(id: number | string): number | null {

        // if we are given an id, ensure that we have the number
        if (typeof id === 'number') {
            if (!this.nodes.has(id)) {
                return null;
            }
            return id;
        }
        
        const theId = this.ids.getOrCreate(id);
        if (!this.nodes.has(theId)) {
            this.nodes.set(theId, new Set<string>());
        }
        return theId;
    }

    private getNodeId(id: number | string): number {
       return (typeof id === 'string') ? this.ids.get(id) : id; 
    }

    /** getNodeLabel gets the string belonging to the given node, or null */
    getNodeString(id: number): string | null {
        return this.ids.reverse(this.getNodeId(id));
    }

    /** hasNode checks if the set has the given node */
    hasNode(id: string | number): boolean {
        return this.nodes.has(this.getNodeId(id));
    }

    /** deleteNode removes the given node and any of it's labels */
    deleteNode(id: string | number): void {
        const theId = this.getNodeId(id);
        
        // remove from known nodes
        this.ids.remove(theId);
        this.nodes.delete(theId);

        // remove edges to and from the node
        this.edges.delete(theId);
        this.edges.forEach(edgeSet => edgeSet.delete(theId));
    }

    /** getNodes gets the ids of the given nodes */
    getNodes(): Set<number> {
        return new Set(this.nodes.keys());
    }

    /** getNodeLabels gets the labels of the provided node, if any */
    getNodeLabels(id: string | number): Set<string> | null {
        const set = this.nodes.get(this.getNodeId(id));
        if (set === null) {
            return null;
        }
        return new Set(set);
    }

    /** addEdge adds an edge with the given labels. If the labels are invalid, returns an error. */
    addEdge(from: string | number, to: string | number, ...labels: string[]): boolean {
        const fromId = this.getOrAddNode(from);
        if (typeof fromId !== 'number') return false;

        const toId = this.getOrAddNode(to);
        if (typeof toId !== 'number') return false;

        // get or initialize this.edges[fromId]
        let fromMap = this.edges.get(fromId);
        if (!fromMap) {
            fromMap = new Map<number, Set<string>>();
            this.edges.set(fromId, fromMap);
        }

            // get or initialize this.edges[fromId][toId];
        let toSet = fromMap.get(toId);
        if (!toSet) {
            toSet = new Set<string>();
            fromMap.set(toId, toSet);
        }

        // add all the labels
        labels.forEach(label => toSet.add(label))
        
        // and done!
        return true;
    }

    /** getEdgeLabels gets the labels of the edge from from to to, or null */
    getEdgeLabels(from: string | number, to: string | number): Set<string> | null {
        const fromId = this.getOrAddNode(from);
        if (typeof fromId !== 'number') return null;

        const toId = this.getOrAddNode(to);
        if (typeof toId !== 'number') return null;

        const fromMap = this.edges.get(fromId);
        if (!fromMap) return null;

        const toSet = fromMap.get(toId);
        if (!toSet) return null;

        return new Set(toSet);
    }

    /** getEdges gets the set of all edges */
    getEdges(): Map<number, Set<number>> {
        const edges = new Map<number, Set<number>>();
        this.edges.forEach((edge, id) => {
            edges.set(id, new Set(edge.keys()));
        })
        return edges;
    }

    /** deleteEdge removes the between the given edges and any associated labels  */
    deleteEdge(from: number | string, to: number|string): void {
        const fromId = this.getOrAddNode(from);
        if (typeof fromId !== 'number') return;

        const toId = this.getOrAddNode(to);
        if (typeof toId !== 'number') return;
        
        const fromMap = this.edges.get(fromId);
        if (!fromMap) return;

        // delete edges to the given id!
        fromMap.delete(toId);
        
        // if there are no more edges left, delete the empty map!
        if (fromMap.size === 0) {
            this.edges.delete(fromId);
        }
    } 
}

class IDMap<T> {
    static readonly Invalid: number = 0; // a node id that is never used
    private lastID: number = IDMap.Invalid + 1; // the first id being used

    private id2val = new Map<number, T>();
    private val2id = new Map<T, number>();

    /** next returns the next unused id number */
    next(): number {
        return this.lastID++;
    }

    /** gets the id of the given element or the invalid id */
    get(t: T): number {
        return this.val2id.get(t) ?? IDMap.Invalid;
    }

    /** gets the id of this element, or creates a new one */
    getOrCreate(t: T): number {
        // get the id if we have it
        const old = this.val2id.get(t);
        if (typeof old === 'number') {
            return old;
        }

        // create a new id
        const id = this.next();
        this.val2id.set(t, id);
        this.id2val.set(id, t);
        return id;
    }

    /**
     * Remove removes the mapping for the given id.
     * The id is not recycled; it will not be used again.
     */
    remove(id: number) {
        // get the value it maps to
        const val = this.id2val.get(id);
        if (typeof val !== 'string') {
            return;
        }

        // and remove it in both directions
        this.id2val.delete(id);
        this.val2id.delete(val);
    }
    
    /** reverse reverses the id (if any) */
    reverse(id: number): T | null {
        const val = this.id2val.get(id);
        if (val === null) {
            return null;
        }
        return val as T;
    }
}