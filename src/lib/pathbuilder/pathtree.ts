import { type Path, type Pathbuilder } from './pathbuilder'

interface MutableProtoBundle {
  id: string
  data: { index: number; path: Path } | null
  parent: MutableProtoBundle | null
  bundles: MutableProtoBundle[]
  fields: ProtoField[]
}
interface ProtoBundle {
  readonly index: number
  readonly path: Path

  readonly bundles: ProtoBundle[]
  readonly fields: ProtoField[]
}

interface ProtoField {
  index: number
  id: string
  path: Path
}

export type Diagnostic = OrphanedField | OrphanedBundle | DuplicateBundle

interface OrphanedField {
  type: 'orphaned_field'
  path: Path
}
interface OrphanedBundle {
  type: 'missing_bundle'
  id: string
}
interface DuplicateBundle {
  type: 'duplicate_bundle'
  path: Path
}

/** an element within the pathArray of this node */
export type PathElement = ConceptPathElement | PropertyPathElement

interface ConceptPathElement extends CommonPathElement {
  /** @inheritdoc */
  type: 'concept'

  /** @inheritdoc */
  role?: never
}
interface PropertyPathElement extends CommonPathElement {
  /** @inheritdoc */
  type: 'property'

  /** @inheritdoc */
  role: 'relation' | 'datatype'
}

interface CommonPathElement {
  /** is this a concept or a property */
  type: string
  /** what role does this element play (if any?) */
  role?: string
  /** the uri of this path element */
  uri: string

  /** the index of this path element within the PathArray */
  index: number

  /**
   * How does this element relate to elements shared with the parent?
   * - a negative value indicates how many elements (including this one) will still appear before the first uncommon concept
   * - a `0` or positive value indicates how many elements have not been shared with the parent (not including this one)
   * - `null` indicates there are no shared concepts.
   */
  common: number | null

  /**
   * How does this element related to the disambiguated concept?
   * - a negative value indicates how many elements (including this one) will still appear before the disambiguated concept
   * - a `0` value indicates that this is the disambiguated concept
   * - a positive value indicates how many elements (including this one) have appeared after the disambiguated concept
   * - `null` indicates there is no disambiguation set on this path
   */
  disambiguation: number | null
}

export abstract class PathTreeNode {
  protected constructor(
    public readonly depth: number,
    public readonly index: number,
  ) {}

  /** checks if this PathTreeNode equals another node */
  abstract equals(other: PathTreeNode): boolean

  /** returns the path that created this PathTreeNode */
  abstract get path(): Path | null

  /** iterates over the elements in the pathArray belonging to the path of this node (if any) */
  *elements(): IterableIterator<PathElement> {
    // get the path
    const path = this.path
    const elements = path?.pathArray?.slice(0)
    if (path === null || typeof elements === 'undefined') return

    // ensure that we have a valid path
    if (elements.length % 2 === 0) {
      console.warn('path of even length: ignoring dangling property')
      elements.pop()
    }

    // figure out what the index within the path is
    const ownPathIndex = this.#ownPathIndex(elements)
    const disambiguationIndex = path.disambiguationIndex

    // add the datatype property (if any)
    const datatypeIndex = elements.length
    if (this instanceof Field && path.datatypeProperty !== '') {
      elements.push(path.datatypeProperty)
    }

    // do the iteration
    for (const [index, uri] of elements.entries()) {
      const common = ownPathIndex !== null ? index - ownPathIndex : null
      const disambiguation =
        disambiguationIndex !== null ? index - disambiguationIndex : null

      switch (index % 2) {
        case 0:
          yield {
            type: 'concept',
            uri,
            index,
            common,
            disambiguation,
          }
          break
        case 1:
          yield {
            type: 'property',
            role: index !== datatypeIndex ? 'relation' : 'datatype',
            uri,
            index,
            common,
            disambiguation,
          }
          break
        default:
          throw new Error('never reached')
      }
    }
  }

  /**
   * The first index in the pathArray that is not shared with the parent.
   * The parent must have an odd-length pathArray (i.e. be a group) which is a prefix of this node's pathArray.
   * If either condition is not met, returns null.
   */
  #ownPathIndex(nodePath: string[] | undefined): number | null {
    if (!Array.isArray(nodePath)) {
      return null
    }

    // parent must have an odd length pathArray
    const parentPath = this.parent?.path?.pathArray
    if (!Array.isArray(parentPath) || parentPath.length % 2 === 0) {
      return null
    }

    // pathArray must be a prefix of the parent's pathArray
    if (
      parentPath.length >= nodePath.length ||
      parentPath.some((parentURI, index) => nodePath[index] !== parentURI)
    ) {
      return null
    }

    return parentPath.length
  }

  /** returns the immediate children of this PathTreeNode */
  abstract children(): IterableIterator<PathTreeNode>

  /** the number of children */
  abstract get childCount(): number

  /** returns the parent of this PathTreeNode */
  abstract get parent(): PathTreeNode | null

  /** compares two nodes, first by depth, then by index */
  static compare(a: PathTreeNode, b: PathTreeNode): -1 | 1 | 0 {
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
  *walk(): IterableIterator<PathTreeNode> {
    yield this

    for (const child of this.children()) {
      for (const relative of child.walk()) {
        yield relative
      }
    }
  }

  /** recursively walks over the children of this NodeLike */
  *walkIDs(): IterableIterator<string> {
    for (const child of this.walk()) {
      const id = child.path?.id
      if (typeof id === 'string') {
        yield id
      }
    }
  }

  /** finds a node within the current subtree that has the given id, if any */
  find(id: string): PathTreeNode | null {
    for (const node of this.walk()) {
      if (node.path?.id === id) {
        return node
      }
    }
    return null
  }

  /** paths returns the paths of this NodeLike */
  *paths(): IterableIterator<Path> {
    for (const child of this.walk()) {
      const { path } = child
      if (path === null) {
        continue
      }
      yield path
    }
  }

  /** returns the set of all known URIs */
  get uris(): Set<string> {
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
  readonly #bundles: Bundle[]
  constructor(bundles: ProtoBundle[]) {
    super(0, -1)
    this.#bundles = bundles.map(bundle => new Bundle(this, bundle))
  }

  /** checks if this PathTreeNode equals another node */
  equals(other: PathTreeNode): boolean {
    return (
      other instanceof PathTree &&
      this.#bundles.length === other.#bundles.length &&
      this.#bundles.every((bundle, index) =>
        bundle.equals(other.#bundles[index]),
      )
    )
  }

  readonly path = null
  readonly parent = null;

  *children(): IterableIterator<Bundle> {
    for (const bundle of this.#bundles) {
      yield bundle
    }
  }

  get childCount(): number {
    return this.#bundles.length
  }

  static fromPathbuilder(
    pb: Pathbuilder,
    emit?: (Diagnostic: Diagnostic) => void,
  ): PathTree {
    const bundles = new Map<string, MutableProtoBundle>()
    const mainBundles: MutableProtoBundle[] = []

    const emitDiagnostic = typeof emit === 'function' ? emit : () => {}

    const getOrCreateBundle = (id: string): MutableProtoBundle => {
      const get = bundles.get(id)
      if (typeof get !== 'undefined') {
        return get
      }

      const create: MutableProtoBundle = {
        id,
        data: null,
        parent: null,
        fields: [],
        bundles: [],
      }
      bundles.set(id, create)
      return create
    }

    pb.paths.forEach((path, index) => {
      if (!path.enabled) return

      const parent =
        path.groupId !== '' ? getOrCreateBundle(path.groupId) : null

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
      mainBundles
        .map(bundle => this.#validateBundle(bundle))
        .filter(bundle => bundle !== null),
    )
  }

  static #validateBundle({
    id,
    data,
    bundles,
    fields,
  }: MutableProtoBundle): ProtoBundle | null {
    if (data === null) {
      return null
    }

    const children = bundles
      .map(bundle => this.#validateBundle(bundle))
      .filter(bundle => bundle !== null)

    return {
      path: data.path,
      index: data.index,
      bundles: children,
      fields,
    }
  }
}

export class Bundle extends PathTreeNode {
  constructor(
    public readonly parent: Bundle | PathTree,
    { index, path, bundles, fields }: ProtoBundle,
  ) {
    // ensure that the proto bundle object is valid
    super(parent.depth + 1, index)
    this.path = path

    bundles.forEach(bundle => {
      this.#childBundles.push(new Bundle(this, bundle))
    })
    fields.forEach(field => {
      this.#childFields.push(new Field(this, field))
    })
  }

  equals(other: PathTreeNode): boolean {
    return (
      other instanceof Bundle &&
      this.path.equals(other.path) && // TODO: path equality
      this.#childBundles.length === other.#childBundles.length &&
      this.#childBundles.every((bundle, index) =>
        bundle.equals(other.#childBundles[index]),
      ) &&
      this.#childFields.length === other.#childFields.length &&
      this.#childFields.every((field, index) =>
        field.equals(other.#childFields[index]),
      )
    )
  }

  public readonly path: Path
  readonly #childBundles: Bundle[] = []
  readonly #childFields: Field[] = [];

  *children(): IterableIterator<PathTreeNode> {
    for (const bundle of this.#childBundles) {
      yield bundle
    }
    for (const field of this.#childFields) {
      yield field
    }
  }

  get childCount(): number {
    return this.#childBundles.length + this.#childFields.length
  }

  /** the direct bundle descendants */
  *bundles(): IterableIterator<Bundle> {
    for (const bundle of this.#childBundles) {
      yield bundle
    }
  }

  /** the direct field descendants */
  *fields(): IterableIterator<Field> {
    for (const field of this.#childFields) {
      yield field
    }
  }
}

export class Field extends PathTreeNode {
  constructor(
    public readonly parent: Bundle,
    field: ProtoField,
  ) {
    super(parent.depth + 1, field.index)
    this.path = field.path
  }

  equals(other: PathTreeNode): boolean {
    return other instanceof Field && this.path.equals(other.path)
  }

  public readonly path: Path;

  *children(): IterableIterator<never> {}

  public readonly childCount = 0
}
