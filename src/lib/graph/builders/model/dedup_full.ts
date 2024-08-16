import {
  type Bundle,
  type Field,
  type ConceptPathElement,
  type PropertyPathElement,
  type PathElement,
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
    elements: PathElement[],
    omitted: boolean,
    previous: NodeContext,
    node: Bundle | Field,
    parent: NodeContext,
  ): NodeContextSpec {
    return FullBuilder.#context
  }

  protected getDatatypeContext(
    elem: PropertyPathElement & { role: 'datatype' },
    elements: PathElement[],
    omitted: boolean,
    node: Field,
    parent: NodeContext,
  ): NodeContextSpec {
    return FullBuilder.#context
  }
}
