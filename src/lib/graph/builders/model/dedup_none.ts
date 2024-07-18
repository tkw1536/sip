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

/** NoneBuilder deduplicates only shared parent paths */
export default class NoneBuilder extends DeduplicatingBuilder {
  prepare(): void {
    this.graph.definitelyAcyclic = true
  }
  protected getConceptContext(
    elem: ConceptPathElement,
    previous: NodeContext,
    node: Bundle | Field,
    parent: NodeContext[],
  ): NodeContextSpec {
    const { common } = elem
    if (common !== null && common < 0) {
      // note: we add the undefined here in case the parent array doesn't have our element
      const parentID = parent[elem.conceptIndex] as NodeContext | undefined
      if (typeof parentID !== 'string') return true
      return parentID
    }
    return true
  }

  protected getDatatypeContext(
    elem: PropertyPathElement & { role: 'datatype' },
    node: Field,
    parent: NodeContext,
  ): NodeContextSpec {
    return true
  }
}
