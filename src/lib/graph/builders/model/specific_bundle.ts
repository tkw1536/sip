import { Bundle, Field } from '../../../pathbuilder/pathtree'
import SpecificBuilder, { type ModelNode } from './specific'

export default class BundleBuilder extends SpecificBuilder {
  public build(): void {
    this.#collectContext()

    for (const bundle of this.tree.children()) {
      this.#addBundle(bundle, 0)
    }
  }

  #collectContext(): void {
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

  readonly #contexts = new Set<string>()
  #addBundle(bundle: Bundle, level: number): boolean {
    // add a node for this bundle itself
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

  /** add a bundle node for the current model */
  #addBundleNode(bundle: Bundle, level: number): string {
    const path = bundle.path.pathArray

    let index = path.length - 1
    if (index % 2 !== 0) {
      console.warn('bundle of even length, ignoring last element', bundle)
      index--
    }

    if (index < 0) {
      console.warn('bundle path has no elements', bundle)
      return ''
    }

    const clz = path[index]

    const id = this.id(clz, 'class', clz)
    this.graph.addOrUpdateNode(id, previous => {
      if (previous?.type === 'field') {
        console.warn('uri used as both property and field', clz)
        return previous
      }

      const bundles = new Set(previous?.bundles ?? [])
      bundles.add(bundle)
      return { type: 'class', clz, bundles }
    })
    return id
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

    // add a function to add the current context and node
    let currentContext: string = ''
    const addNodeIfNotExists = (i: number): string => {
      const clz = ownPath[i]
      if (this.#contexts.has(clz)) {
        currentContext = clz
      }

      const id = this.id(currentContext, 'class', clz)
      if (!this.graph.hasNode(id)) {
        this.graph.addNode({ type: 'class', clz, bundles: new Set() }, id)
      }
      return id
    }

    // add all the parts of the path
    let prev = addNodeIfNotExists(0)
    for (let i = 1; i + 1 < ownPath.length; i += 2) {
      const next = addNodeIfNotExists(i + 1)
      const property = ownPath[i]
      if (this.tracker.add([currentContext, prev, next, property])) {
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
