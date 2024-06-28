import { Path, type Pathbuilder } from './pathbuilder'

export abstract class NodeLike {
  abstract get path (): Path | null
  abstract get children (): NodeLike[]
  abstract get parent (): NodeLike | null

  private _depth: number = -1
  get depth (): number {
    return this._depth
  }

  private _index: number = -1
  get index (): number {
    return this._index
  }

  static compare (a: NodeLike, b: NodeLike): -1 | 1 | 0 {
    if (a._depth < b._depth) {
      return -1
    }
    if (a._depth > b._depth) {
      return 1
    }
    if (a._index < b._index) {
      return -1
    }
    if (a._index > b._index) {
      return 1
    }
    return 0
  }

  static fromPathbuilder (pb: Pathbuilder): PathTree {
    const bundles = new Map<string, Bundle>()

    const getOrCreateBundle = (id: string): Bundle => {
      const bundle = bundles.get(id)
      if (typeof bundle === 'undefined') {
        const bundle = new Bundle(Path.invalid(), null, [], new Map<string, Field>())
        bundles.set(id, bundle)
        return bundle
      }
      return bundle
    }

    const mainBundles: Bundle[] = []

    pb.paths.filter(path => path.enabled).forEach((path, index) => {
      const parent = path.groupId !== '' ? getOrCreateBundle(path.groupId) : null

      // not a group => it is just a field
      if (!path.isGroup) {
        if (parent === null) {
          console.warn('non-group path missing group_id', path)
          return
        }
        parent.childFields.set(path.field, new Field(path, parent))
        return
      }

      const group = getOrCreateBundle(path.id)
      group.set(path, parent)
      if (parent !== null) {
        parent.childBundles.push(group)
      } else {
        mainBundles.push(group)
      }
    })

    const tree = new PathTree(mainBundles)
    tree._depth = -1

    let index = 0
    tree._index = index++

    for (const relative of tree.walk()) {
      relative._depth = (relative?.parent?._depth ?? 0) + 1
      relative._index = index++
    }
    return tree
  }

  /** recursively walks over the tree of this NodeLike */
  * walk (): IterableIterator<NodeLike> {
    yield this

    for (const child of this.children) {
      for (const relative of child.walk()) {
        yield relative
      }
    }
  }

  /** paths returns the paths of this NodeLike */
  * paths (): IterableIterator<Path> {
    for (const child of this.walk()) {
      const { path } = child
      if (path === null) {
        continue
      }
      yield path
    }
  }

  /** returns the set of all known URIs */
  get uris (): Set<string> {
    const uris = new Set<string>()

    for (const path of this.paths()) {
      for (const uri of path.uris()) {
        uris.add(uri)
      }
    }

    return uris
  }

  /** allChildren returns a set containing the ids of all recursive children of this node */
  * allChildren (): IterableIterator<string> {
    for (const child of this.walk()) {
      const id = child.path?.id
      if (typeof id === 'string') {
        yield id
      }
    }
  }

  /** find finds the first node with the given id, including itself */
  find (id: string): NodeLike | null {
    const myID = this.path?.id
    if (myID === id) {
      return this
    }

    const children = this.children
    for (let i = 0; i < children.length; i++) {
      const found = children[i].find(id)
      if (found !== null) {
        return found
      }
    }
    return null
  }
}

export class PathTree extends NodeLike {
  constructor (
    public mainBundles: Bundle[]
  ) {
    super()
  }

  readonly path = null
  readonly parent = null

  get children (): Bundle[] {
    return [...this.mainBundles]
  }
}

export class Bundle extends NodeLike {
  constructor (
    private _path: Path,
    private _parent: Bundle | null,

    public childBundles: Bundle[],
    public childFields: Map<string, Field>
  ) { super() }

  get parent (): Bundle | null {
    return this._parent
  }

  set (path: Path, parent: Bundle | null): void {
    this._path = path
    this._parent = parent
  }

  get path (): Path {
    return this._path
  }

  get children (): Array<Bundle | Field> {
    return [...this.childBundles, ...this.childFields.values()]
  }
}

export class Field extends NodeLike {
  constructor (
    private readonly _path: Path,
    private readonly _parent: Bundle
  ) { super() }

  get parent (): Bundle {
    return this._parent
  }

  get path (): Path {
    return this._path
  }

  get children (): Array<Bundle | Field> {
    return []
  }
}
