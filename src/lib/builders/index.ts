import Graph from "../graph";

export default abstract class GraphBuilder<NodeLabel, EdgeLabel> {
    private done: boolean = false;
    protected readonly graph = new Graph<NodeLabel, EdgeLabel>();
    protected readonly tracker = new ArrayTracker<string>(); 
    
    public build(): typeof this.graph {
        // ensure that we're only called once!
        if (this.done) {
            return this.graph;
        }
        this.done = true;

        this.doBuild();

        // and return the graph;
        return this.graph;
    }

    /** doBuild builds the actual graph */
    protected abstract doBuild(): void;
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