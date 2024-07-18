import type Graph from '../..'
import { type NamespaceMap } from '../../../pathbuilder/namespace'
import {
  type Bundle,
  type Field,
  type PathTree,
  type PathTreeNode,
} from '../../../pathbuilder/pathtree'
import ArrayTracker from '../../../utils/array-tracker'

export interface SharedOptions {
  include?: (node: PathTreeNode) => boolean
}

export type ModelNode =
  | {
      /* represents a single class node */
      type: 'class'
      clz: string

      /** bundles rooted at this node */
      bundles: Set<Bundle>
    }
  | {
      type: 'field'
      fields: Set<Field> /** the field at this path */
    }

/** modelNodeLabel returns a simple label for a model node */
export function modelNodeLabel(node: ModelNode, ns: NamespaceMap): string {
  if (node.type === 'field') {
    return Array.from(node.fields)
      .map(field => field.path.name)
      .join('\n\n')
  }
  if (node.type === 'class' && node.bundles.size === 0) {
    return ns.apply(node.clz)
  }
  if (node.type === 'class' && node.bundles.size > 0) {
    const names = Array.from(node.bundles)
      .map(bundle => 'Bundle ' + bundle.path.name)
      .join('\n\n')
    return ns.apply(node.clz) + '\n\n' + names
  }
  throw new Error('never reached')
}

export type ModelEdge =
  | {
      /* represents a property between two class nodes */
      type: 'property'
      property: string
    }
  | {
      /** represents a datatype property */
      type: 'data'
      property: string
    }

export default abstract class SpecificBuilder {
  protected readonly tracker = new ArrayTracker<string>()
  readonly #options: SharedOptions
  constructor(
    protected tree: PathTree,
    options: SharedOptions,
    protected graph: Graph<ModelNode, ModelEdge>,
  ) {
    this.#options = options
  }

  public abstract build(): void

  /** checks if the given uri is included in the graph */
  protected includes(node: PathTreeNode): boolean {
    if (this.#options.include == null) return true

    return this.#options.include(node)
  }

  protected id(context: string, typ: 'class' | 'data', id: string): string {
    return `context=${encodeURIComponent(context)}&typ=${encodeURIComponent(typ)}&id=${encodeURIComponent(id)}`
  }
}
