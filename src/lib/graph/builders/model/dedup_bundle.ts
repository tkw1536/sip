import {
  Bundle,
  type ConceptPathElement,
  Field,
  type PropertyPathElement,
} from '../../../pathbuilder/pathtree'
import {
  type NodeContext,
  type NodeContextSpec,
  DeduplicatingBuilder,
} from './dedup'

export default class BundleBuilder extends DeduplicatingBuilder {
  readonly #contexts = new Set<string>()
  prepare(): void {
    for (const node of this.tree.walk()) {
      if (node instanceof Field) {
        const disambiguation = node.path.disambiguatedConcept
        if (disambiguation === null) continue

        this.#contexts.add(disambiguation)
        continue
      }

      if (node instanceof Bundle) {
        const path = node.path.pathArray
        let index = path.length - 1
        if (index % 2 === 1) {
          index--
        }
        if (index < 0) continue

        this.#contexts.add(path[index])
        continue
      }
    }
  }
  protected getConceptContext(
    elem: ConceptPathElement,
    previous: NodeContext,
    node: Bundle | Field,
    parent: NodeContext,
  ): NodeContextSpec {
    // if we have a common element with the parent, use that
    const { common } = elem
    if (common !== null && common < 0 && parent !== false) {
      return parent
    }

    // if we have the class as a context => use it
    if (this.#contexts.has(elem.uri)) {
      return elem.uri
    }

    // re-use the previous context (or make a new one if it doesn't exist)
    return previous === false ? true : previous
  }

  protected getDatatypeContext(
    elem: PropertyPathElement & { role: 'datatype' },
    node: Field,
    parent: NodeContext,
  ): NodeContextSpec {
    // draw it in the context of the previous node
    if (typeof parent !== 'string') return true
    return parent
  }
}
