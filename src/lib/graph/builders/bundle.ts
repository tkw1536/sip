import GraphBuilder from '.'
import { Bundle, Field, PathTree } from '../../pathtree'
import Selection from '../../selection'

export type BundleNode = {
  type: 'bundle'
  level: number
  bundle: Bundle
} | {
  type: 'field'
  level: number
  field: Field
}

export type BundleEdge = {
  type: 'field'
} | {
  type: 'child_bundle'
}

export default class BundleGraphBuilder extends GraphBuilder<BundleNode, BundleEdge> {
  constructor (private readonly tree: PathTree, private readonly selection: Selection) {
    super()
  }

  protected doBuild (): void {
    this.tree.mainBundles.forEach(bundle => this.addBundle(bundle, 0))
    this.graph.definitelyAcyclic = true
  }

  private addBundle (bundle: Bundle, level: number): boolean {
    const id = bundle.path().id

    // add the node for this bundle
    const includeSelf = this.selection.includes(bundle.path().id)
    if (includeSelf) {
      this.graph.addNode({ type: 'bundle', level: 2 * level, bundle }, id)
    }

    // add all the child bundles
    bundle.childBundles.forEach(cb => {
      const includeChild = this.addBundle(cb, level + 1)
      if (!includeChild || !includeSelf) return

      this.graph.addEdge(id, cb.path().id, { type: 'child_bundle' })
    })

    // add all the child fields
    bundle.childFields.forEach(cf => {
      const fieldId = cf.path().id
      const includeField = this.selection.includes(cf.path().id)
      if (!includeField) return

      this.graph.addNode({ type: 'field', level: 2 * level + 1, field: cf }, fieldId)
      if (!includeSelf) return

      this.graph.addEdge(id, fieldId, { type: 'field' })
    })

    return includeSelf
  }
}
