import GraphBuilder from '.'
import Deduplication from '../../../app/state/state/deduplication'
import type Graph from '..'
import {
  Bundle,
  Field,
  type PathTree,
  type PathTreeNode,
} from '../../pathbuilder/pathtree'
import ArrayTracker from '../../utils/array-tracker'
import { type NamespaceMap } from '../../namespace'

export type Options = SharedOptions & {
  deduplication?: Deduplication
}

interface SharedOptions {
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

/** builds a new graph for a specific model */
export default class ModelGraphBuilder extends GraphBuilder<
  ModelNode,
  ModelEdge
> {
  private readonly specific: SpecificBuilder
  constructor(
    private readonly tree: PathTree,
    private readonly options: Options,
  ) {
    super()

    const { deduplication, ...specificOptions } = options
    switch (this.options.deduplication) {
      case Deduplication.Full:
        this.specific = new FullBuilder(tree, specificOptions, this.graph)
        break
      case Deduplication.None:
        this.specific = new NoneBuilder(tree, specificOptions, this.graph)
        break
      case Deduplication.Bundle:
        this.specific = new BundleBuilder(tree, specificOptions, this.graph)
        break
      default:
        throw new Error('unknown specific builder')
    }
  }

  protected async doBuild(): Promise<void> {
    this.specific.build()
  }
}

abstract class SpecificBuilder {
  protected readonly tracker = new ArrayTracker<string>()
  constructor(
    public tree: PathTree,
    private readonly options: SharedOptions,
    protected graph: Graph<ModelNode, ModelEdge>,
  ) {}

  public abstract build(): void

  /** checks if the given uri is included in the graph */
  protected includes(node: PathTreeNode): boolean {
    if (this.options.include == null) return true

    return this.options.include(node)
  }

  protected id(context: string, typ: 'class' | 'data', id: string): string {
    return `context=${encodeURIComponent(context)}&typ=${encodeURIComponent(typ)}&id=${encodeURIComponent(id)}`
  }
}

class NoneBuilder extends SpecificBuilder {
  public build(): void {
    for (const bundle of this.tree.children()) {
      this.addBundle(null, bundle, 0)
    }
    this.graph.definitelyAcyclic = true
  }

  private addBundle(
    parentNode: number | null,
    bundle: Bundle,
    level: number,
  ): boolean {
    // add the node for this bundle
    const includeSelf = this.includes(bundle)

    let selfNode: number | null = null
    if (includeSelf) {
      selfNode = this.addBundleNode(bundle, level)
    }

    // add all the child bundles
    for (const cb of bundle.bundles()) {
      this.addBundle(selfNode, cb, level + 1)
    }

    // add all the child fields
    for (const cf of bundle.fields()) {
      const includeField = this.includes(cf)
      if (!includeField) continue

      this.addField(selfNode, cf)
    }

    return includeSelf
  }

  private addBundleNode(bundle: Bundle, level: number): number | null {
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

  private addField(parentNode: number | null, node: Field): void {
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

class BundleBuilder extends SpecificBuilder {
  public build(): void {
    this.collectContext()

    for (const bundle of this.tree.children()) {
      this.addBundle(bundle, 0)
    }
  }

  private collectContext(): void {
    for (const node of this.tree.walk()) {
      if (node instanceof Field) {
        const disambiguation = node.path.getDisambiguation()
        if (disambiguation === null) continue

        this.contexts.add(disambiguation)
        continue
      }

      if (node instanceof Bundle) {
        const path = node.path.pathArray
        let index = path.length - 1
        if (index % 2 === 1) {
          index--
        }
        if (index < 0) continue

        this.contexts.add(path[index])
        continue
      }
    }
  }

  private readonly contexts = new Set<string>()
  private addBundle(bundle: Bundle, level: number): boolean {
    // add a node for this bundle itself
    const includeSelf = this.includes(bundle)

    if (includeSelf) {
      this.addBundleNode(bundle, level)
    }

    // add all the child bundles
    for (const cb of bundle.bundles()) {
      this.addBundle(cb, level + 1)
    }

    // add all the child fields
    for (const cf of bundle.fields()) {
      const includeField = this.includes(cf)
      if (!includeField) continue

      this.addField(cf)
    }

    return includeSelf
  }

  /** add a bundle node for the current model */
  private addBundleNode(bundle: Bundle, level: number): string {
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

  private addField(node: Field): void {
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
      if (this.contexts.has(clz)) {
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

class FullBuilder extends SpecificBuilder {
  public build(): void {
    for (const bundle of this.tree.children()) {
      this.addBundle(bundle, 0)
    }
  }

  private addBundle(bundle: Bundle, level: number): boolean {
    // add the node for this bundle
    const includeSelf = this.includes(bundle)

    if (includeSelf) {
      this.addBundleNode(bundle, level)
    }

    // add all the child bundles
    for (const cb of bundle.bundles()) {
      this.addBundle(cb, level + 1)
    }

    // add all the child fields
    for (const cf of bundle.fields()) {
      const includeField = this.includes(cf)
      if (!includeField) continue

      this.addField(cf)
    }

    return includeSelf
  }

  private addBundleNode(bundle: Bundle, level: number): void {
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

  private addField(node: Field): void {
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
