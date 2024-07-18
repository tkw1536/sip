import {
  type Bundle,
  type Field,
  type ConceptPathElement,
  type PropertyPathElement,
} from '../../../pathbuilder/pathtree'
import {
  type NodeContext,
  type NodeContextSpec,
  DeduplicatingBuilder,
} from './dedup'

/** FullBuilder deduplicates nodes globally */
export default class FullBuilder extends DeduplicatingBuilder {
  static readonly #context = ''

  protected getConceptContext(
    elem: ConceptPathElement,
    previous: NodeContext,
    node: Bundle | Field,
    parent: NodeContext[],
  ): NodeContextSpec {
    return FullBuilder.#context
  }

  protected getDatatypeContext(
    elem: PropertyPathElement & { role: 'datatype' },
    node: Field,
    parent: NodeContext,
  ): NodeContextSpec {
    return FullBuilder.#context
  }
}
