import { Path, Pathbuilder } from "./pathbuilder";

abstract class Node {
    abstract path(): Path | null;
    abstract children(): Array<Node>;

    /** allChildren returns a set containing the ids of all recursive children of this node */
    allChildren(): Array<string> {
        const children: Array<string> = [];
        this.collectChildren(children);
        return children;
    }
    private collectChildren(children: Array<string>) {
        const myID = this.path().id;
        if (myID !== null) {
            children.push(myID);
        }

        this.children().forEach(c => c.collectChildren(children))
    }

    /** find finds the first node with the given id, including itself */
    find(id: string): Node | null {
        const myID = this.path().id;
        if (myID !== id) {
            return this;
        }

        const children = this.children()
        for (let i = 0; i < children.length; i++ ) {
            const found = children[i].find(id);
            if (found !== null) {
                return found;
            }
        }
        return null;
    }
}

export class PathTree extends Node {
    constructor(
        public mainBundles: Bundle[],
    ) {
        super()
    }
    path(): null {
        return null;
    }
    children(): Bundle[] {
       return [...this.mainBundles]; 
    }

    static fromPathbuilder(pb: Pathbuilder): PathTree {
        const bundles = new Map<string, Bundle>();

        const get_or_create_bundle = (id: string): Bundle => {
            if (!bundles.has(id)) {
                const bundle = new Bundle(null, null, [], new Map<string, Field>());
                bundles.set(id, bundle);
            }
            return bundles.get(id)!;
        }

        const mainBundles: Array<Bundle> = [];

        pb.paths.filter(path => path.enabled).forEach(path => {
            const parent = path.group_id !== "" ? get_or_create_bundle(path.group_id) : null;

            // not a group => it is just a field
            if (!path.is_group) {
                if (parent === null) {
                    console.warn(`non-group path missing group_id`, path);
                    return;
                }

                parent.childFields.set(path.field, new Field(path));
                return;
            }

            const group = get_or_create_bundle(path.id);
            group.setPath(path);
            group.parent = parent;
            if (parent !== null) {
                parent.childBundles.push(group);
            } else {
                mainBundles.push(group);
            }
        })

        return new PathTree(mainBundles);
    }
}

export class Bundle extends Node {
    constructor(
        private _path: Path,

        public parent: Bundle | null,
        public childBundles: Bundle[],
        public childFields: Map<string, Field>,
    ) {
        super()
    }

    setPath(path: Path) {
        this._path = path;
    }

    path(): Path {
        return this._path;
    }

    children(): Array<Bundle | Field> {
        return [...this.childBundles, ...this.childFields.values()];
    }
}

export class Field extends Node {
    constructor(private _path: Path) {
        super()
    }

    path(): Path {
        return this._path;
    }

    children(): Array<Bundle | Field> {
        return [];
    }
}

