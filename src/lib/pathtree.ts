import { type Path, type Pathbuilder } from './pathbuilder'

interface MutableProtoBundle { id: string, data: { index: number, path: Path } | null, parent: MutableProtoBundle | null, bundles: MutableProtoBundle[], fields: ProtoField[] }
interface ProtoBundle {
  readonly index: number
  readonly path: Path

  readonly bundles: ProtoBundle[]
  readonly fields: ProtoField[]
}

interface ProtoField { index: number, id: string, path: Path }

export type Diagnostic = OrphanedField | OrphanedBundle | DuplicateBundle

interface OrphanedField { type: 'orphaned_field', path: Path }
interface OrphanedBundle { type: 'missing_bundle', id: string }
interface DuplicateBundle { type: 'duplicate_bundle', path: Path }

export abstract class PathTreeNode {
  protected constructor (
    public readonly depth: number,
    public readonly index: number
  ) {}

  /** returns the path that created this PathTreeNode */
  abstract get path (): Path | null

  /** returns the immediate children of this PathTreeNode */
  abstract children (): IterableIterator<PathTreeNode>

  /** the number of children */
  abstract get childCount (): number

  /** allChildren returns a set containing the ids of all recursive children of this node */
  * allChildren (): IterableIterator<string> {
    for (const child of this.walk()) {
      const id = child.path?.id
      if (typeof id === 'string') {
        yield id
      }
    }
  }

  /** returns the parent of this PathTreeNode */
  abstract get parent (): PathTreeNode | null

  static compare (a: PathTreeNode, b: PathTreeNode): -1 | 1 | 0 {
    if (a.depth < b.depth) {
      return -1
    }
    if (a.depth > b.depth) {
      return 1
    }
    if (a.index < b.index) {
      return -1
    }
    if (a.index > b.index) {
      return 1
    }
    return 0
  }

  /** recursively walks over the tree of this NodeLike */
  * walk (): IterableIterator<PathTreeNode> {
    yield this

    for (const child of this.children()) {
      for (const relative of child.walk()) {
        yield relative
      }
    }
  }

  /** finds a node within the current subtree that has the given id, if any */
  find (id: string): PathTreeNode | null {
    for (const node of this.walk()) {
      if (node.path?.id === id) {
        return node
      }
    }
    return null
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
}

export class PathTree extends PathTreeNode {
  private readonly bundles: Bundle[]
  constructor (bundles: ProtoBundle[]) {
    super(0, -1)
    this.bundles = bundles.map(bundle => new Bundle(this, bundle))
  }

  readonly path = null
  readonly parent = null;

  * children (): IterableIterator<Bundle> {
    for (const bundle of this.bundles) {
      yield bundle
    }
  }

  get childCount (): number {
    return this.bundles.length
  }

  static fromPathbuilder (pb: Pathbuilder, emit?: (Diagnostic: Diagnostic) => void): PathTree {
    const bundles = new Map<string, MutableProtoBundle>()
    const mainBundles: MutableProtoBundle[] = []

    const emitDiagnostic = typeof emit === 'function' ? emit : () => {}

    const getOrCreateBundle = (id: string): MutableProtoBundle => {
      const get = bundles.get(id)
      if (typeof get !== 'undefined') {
        return get
      }

      const create: MutableProtoBundle = { id, data: null, parent: null, fields: [], bundles: [] }
      bundles.set(id, create)
      return create
    }

    pb.paths.forEach((path, index) => {
      if (!path.enabled) return

      const parent = path.groupId !== '' ? getOrCreateBundle(path.groupId) : null

      // not a group => it is just a field
      if (!path.isGroup) {
        const field = { id: path.field, index, path }

        if (parent === null) {
          emitDiagnostic({ type: 'orphaned_field', path })
          return
        }
        parent.fields.push(field)
        return
      }

      const group = getOrCreateBundle(path.id)
      if (group.data !== null) {
        emitDiagnostic({ type: 'duplicate_bundle', path })
        return
      }
      group.data = { index, path }
      group.parent = parent

      if (parent !== null) {
        parent.bundles.push(group)
      } else {
        mainBundles.push(group)
      }
    })

    // check for data about missing bundles
    for (const [id, bundle] of bundles.entries()) {
      if (bundle.data === null) {
        emitDiagnostic({ type: 'missing_bundle', id })
      }
    }

    return new PathTree(
      mainBundles.map(bundle => this.validateBundle(bundle)).filter(bundle => bundle !== null)
    )
  }

  private static validateBundle ({ id, data, bundles, fields }: MutableProtoBundle): ProtoBundle | null {
    if (data === null) {
      return null
    }

    const children = bundles.map(bundle => this.validateBundle(bundle)).filter(bundle => bundle !== null)

    return {
      path: data.path,
      index: data.index,
      bundles: children,
      fields
    }
  }
}

export class Bundle extends PathTreeNode {
  constructor (
    public readonly parent: Bundle | PathTree,
    { index, path, bundles, fields }: ProtoBundle
  ) {
    // ensure that the proto bundle object is valid
    super(parent.depth + 1, index)
    this.path = path

    bundles.forEach(bundle => {
      this.bundles2.push(new Bundle(this, bundle))
    })
    fields.forEach(field => {
      this.fields2.push(new Field(this, field))
    })
  }

  public readonly path: Path
  private readonly bundles2: Bundle[] = []
  private readonly fields2: Field[] = [];

  * children (): IterableIterator<PathTreeNode> {
    for (const bundle of this.bundles2) {
      yield bundle
    }
    for (const field of this.fields2) {
      yield field
    }
  }

  get childCount (): number {
    return this.bundles2.length
  }

  /** the direct bundle descendants */
  * bundles (): IterableIterator<Bundle> {
    for (const bundle of this.bundles2) {
      yield bundle
    }
  }

  /** the direct field descendants */
  * fields (): IterableIterator<Field> {
    for (const field of this.fields2) {
      yield field
    }
  }
}

export class Field extends PathTreeNode {
  constructor (
    public readonly parent: Bundle,
    field: ProtoField
  ) {
    super(parent.depth + 1, field.index)
    this.path = field.path
  }

  public readonly path: Path

  * children (): IterableIterator<never> { }

  public readonly childCount = 0
}
