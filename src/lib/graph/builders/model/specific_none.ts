import { type Bundle, type Field } from '../../../pathbuilder/pathtree'
import SpecificBuilder from './specific'

export default class NoneBuilder extends SpecificBuilder {
  public build(): void {
    for (const bundle of this.tree.children()) {
      this.#addBundle(null, bundle, 0)
    }
    this.graph.definitelyAcyclic = true
  }

  #addBundle(
    parentNode: number | null,
    bundle: Bundle,
    level: number,
  ): boolean {
    // add the node for this bundle
    const includeSelf = this.includes(bundle)

    let selfNode: number | null = null
    if (includeSelf) {
      selfNode = this.#addBundleNode(bundle, level)
    }

    // add all the child bundles
    for (const cb of bundle.bundles()) {
      this.#addBundle(selfNode, cb, level + 1)
    }

    // add all the child fields
    for (const cf of bundle.fields()) {
      const includeField = this.includes(cf)
      if (!includeField) continue

      this.#addField(selfNode, cf)
    }

    return includeSelf
  }

  #addBundleNode(bundle: Bundle, level: number): number | null {
    const path = bundle.path.pathArray

    let index = path.length - 1
    if (index % 2 !== 0) {
      console.warn('bundle of even length, ignoring last element', bundle)
      index--
    }

    if (index < 0) {
      console.warn('bundle path has no elements', bundle)
      return null
    }

    const clz = path[index]
    return this.graph.addNode({
      type: 'class',
      clz,
      bundles: new Set([bundle]),
    })
  }

  #addField(parentNode: number | null, node: Field): void {
    // get the actual path to add
    const path = node.path

    // find the path to include for this element
    let ownPath = path.pathArray

    // remove the parent path (if we've already added it)
    const parent = node.parent
    const displayParent = this.includes(parent)
    if (displayParent && typeof parentNode === 'number') {
      const length = parent.path?.pathArray?.length
      if (typeof length === 'number' && length >= 0 && length % 2 === 0) {
        ownPath = ownPath.slice(length)
      }
    }

    // make a function to add a node
    const addNode = (i: number): number => {
      return this.graph.addNode({
        type: 'class',
        clz: ownPath[i],
        bundles: new Set(),
      })
    }

    // add all the parts of the node
    let prev = parentNode
    if (typeof prev !== 'number') {
      prev = addNode(0)
    }
    for (let i = 1; i + 1 < ownPath.length; i += 2) {
      const next = addNode(i + 1)
      const property = ownPath[i]
      this.graph.addEdge(prev, next, {
        type: 'property',
        property,
      })
      prev = next
    }

    // check if we have a datatype property
    if (path.datatypeProperty === '') {
      return
    }

    // add the datatype property (if any)
    const datatype = this.graph.addNode({
      type: 'field',
      fields: new Set([node]),
    })
    this.graph.addEdge(prev, datatype, {
      type: 'data',
      property: path.datatypeProperty,
    })
  }
}
