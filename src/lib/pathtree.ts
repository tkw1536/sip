import { Path, Pathbuilder } from './pathbuilder'

export abstract class NodeLike {
  abstract get path (): Path | null
  abstract get children (): NodeLike[]
  abstract get parent (): NodeLike | null

  /** recursively walks over the tree of this NodeLike */
  * walk (): IterableIterator<NodeLike> {
    yield this

    for (const child of this.children) {
      for (const relative of child.walk()) {
        yield relative
      }
    }
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

  get path (): null {
    return null
  }

  get parent (): null {
    return null
  }

  get children (): Bundle[] {
    return [...this.mainBundles]
  }

  static fromPathbuilder (pb: Pathbuilder): PathTree {
    const bundles = new Map<string, Bundle>()

    const getOrCreateBundle = (id: string): Bundle => {
      const bundle = bundles.get(id)
      if (typeof bundle === 'undefined') {
        const bundle = new Bundle(Path.create(), null, [], new Map<string, Field>())
        bundles.set(id, bundle)
        return bundle
      }
      return bundle
    }

    const mainBundles: Bundle[] = []

    pb.paths.filter(path => path.enabled).forEach(path => {
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

    return new PathTree(mainBundles)
  }
}

export class Bundle extends NodeLike {
  constructor (
    private _path: Path,
    private _parent: Bundle | null,

    public childBundles: Bundle[],
    public childFields: Map<string, Field>
  ) {
    super()
  }

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
  constructor (private readonly _path: Path, private readonly _parent: Bundle) {
    super()
  }

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
