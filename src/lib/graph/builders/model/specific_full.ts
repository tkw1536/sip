import { type Field, type Bundle } from '../../../pathbuilder/pathtree'
import SpecificBuilder, { type ModelNode } from './specific'

export default class FullBuilder extends SpecificBuilder {
  public build(): void {
    for (const bundle of this.tree.children()) {
      this.#addBundle(bundle, 0)
    }
  }

  #addBundle(bundle: Bundle, level: number): boolean {
    // add the node for this bundle
    const includeSelf = this.includes(bundle)

    if (includeSelf) {
      this.#addBundleNode(bundle, level)
    }

    // add all the child bundles
    for (const cb of bundle.bundles()) {
      this.#addBundle(cb, level + 1)
    }

    // add all the child fields
    for (const cf of bundle.fields()) {
      const includeField = this.includes(cf)
      if (!includeField) continue

      this.#addField(cf)
    }

    return includeSelf
  }

  #addBundleNode(bundle: Bundle, level: number): void {
    const path = bundle.path.pathArray

    let index = path.length - 1
    if (index % 2 !== 0) {
      console.warn('bundle of even length, ignoring last element', bundle)
      index--
    }

    if (index < 0) {
      console.warn('bundle path has no elements', bundle)
      return
    }

    const clz = path[index]
    const clzID = this.id('', 'class', clz)
    this.graph.addOrUpdateNode(clzID, previous => {
      if (previous?.type === 'field') {
        console.warn('uri used as both property and field', clz)
        return previous
      }

      const bundles = new Set(previous?.bundles ?? [])
      bundles.add(bundle)
      return { type: 'class', clz, bundles }
    })
  }

  #addField(node: Field): void {
    // get the actual path to add
    const path = node.path

    // find the path to include for this element
    let ownPath = path.pathArray

    // remove the parent path (if we've already added it)
    const parent = node.parent
    const displayParent = this.includes(parent)
    if (displayParent) {
      const length = parent.path?.pathArray?.length
      if (typeof length === 'number' && length >= 0 && length % 2 === 0) {
        ownPath = ownPath.slice(length)
      }
    }

    // make a function to add a node
    const addNodeIfNotExists = (i: number): string => {
      const clz = ownPath[i]
      const clzID = this.id('', 'class', clz)

      if (!this.graph.hasNode(clzID)) {
        this.graph.addNode({ type: 'class', clz, bundles: new Set() }, clzID)
      }

      return clzID
    }

    // add all the parts of the node
    let prev = addNodeIfNotExists(0)
    for (let i = 1; i + 1 < ownPath.length; i += 2) {
      const next = addNodeIfNotExists(i + 1)
      const property = ownPath[i]
      if (this.tracker.add([prev, next, property])) {
        this.graph.addEdge(prev, next, {
          type: 'property',
          property,
        })
      }
      prev = next
    }

    // check if we have a datatype property
    const { datatypeProperty } = path
    if (datatypeProperty === '') {
      return
    }

    // add the current data node
    const dataNode = this.id(prev, 'data', datatypeProperty)
    const shouldAddEdge = !this.graph.hasNode(dataNode)
    this.graph.addOrUpdateNode(
      dataNode,
      (label?: ModelNode | undefined): ModelNode => {
        if (label?.type === 'class') {
          throw new Error('ModelBuilder: expected field node in data context')
        }

        const fields = new Set(label?.fields ?? [])
        fields.add(node)

        return {
          type: 'field',
          fields,
        }
      },
    )

    if (shouldAddEdge) {
      this.graph.addEdge(prev, dataNode, {
        type: 'data',
        property: datatypeProperty,
      })
    }
  }
}
