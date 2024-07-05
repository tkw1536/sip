import GraphBuilder from '.'
import { type Bundle, type Field, type PathTree } from '../../pathbuilder/pathtree'
import type NodeSelection from '../../pathbuilder/annotations/selection'

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
  constructor (private readonly tree: PathTree, private readonly selection: NodeSelection) {
    super()
  }

  protected async doBuild (): Promise<void> {
    for (const bundle of this.tree.children()) {
      this.addBundle(bundle, 0)
    }
    this.graph.definitelyAcyclic = true
  }

  private addBundle (bundle: Bundle, level: number): boolean {
    const id = bundle.path.id

    // add the node for this bundle
    const includeSelf = this.selection.includes(bundle)
    if (includeSelf) {
      this.graph.addNode({ type: 'bundle', level: 2 * level, bundle }, id)
    }

    // add all the child bundles
    for (const cb of bundle.bundles()) {
      const includeChild = this.addBundle(cb, level + 1)
      if (!includeChild || !includeSelf) continue

      this.graph.addEdge(id, cb.path.id, { type: 'child_bundle' })
    }

    // add all the child fields
    for (const cf of bundle.fields()) {
      const fieldId = cf.path.id
      const includeField = this.selection.includes(cf)
      if (!includeField) continue

      this.graph.addNode({ type: 'field', level: 2 * level + 1, field: cf }, fieldId)
      if (!includeSelf) continue

      this.graph.addEdge(id, fieldId, { type: 'field' })
    }

    return includeSelf
  }
}
