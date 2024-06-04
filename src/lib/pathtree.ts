import { Path, Pathbuilder } from "./pathbuilder";

export class PathTree {
    constructor(
        public mainBundles: Bundle[],
    ) { }

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
            group.path = path;
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

export class Bundle {
    constructor(
        public path: Path,

        public parent: Bundle | null,
        public childBundles: Bundle[],
        public childFields: Map<string, Field>,
    ) { }
}

export class Field {
    constructor(public path: Path) { }
}