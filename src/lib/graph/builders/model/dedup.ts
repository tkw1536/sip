import type Graph from '../..'
import { type NamespaceMap } from '../../../pathbuilder/namespace'
import {
  Bundle,
  Field,
  type PathTree,
  type PathTreeNode,
  type ConceptPathElement,
  type PropertyPathElement,
} from '../../../pathbuilder/pathtree'
import ArrayTracker from '../../../utils/array-tracker'
import ImmutableSet from '../../../utils/immutable-set'

export interface SharedOptions {
  include?: (node: PathTreeNode) => boolean
}

export type ModelNode =
  | {
      /* represents a single class node */
      type: 'class'
      clz: string

      /** bundles rooted at this node */
      bundles: ImmutableSet<Bundle>

      /** non-datatype fields at this node */
      fields: ImmutableSet<Field>
    }
  | {
      type: 'literal'
      fields: ImmutableSet<Field> /** the field at this path */
    }

/** modelNodeLabel returns a simple label for a model node */
export function modelNodeLabel(node: ModelNode, ns: NamespaceMap): string {
  if (node.type === 'literal') {
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

/**
 * A specification for which to draw the node in.
 * Numeric-only IDs should be avoided.
 *
 * - `true` means to always draw the node, even if it has been included before.
 * - `false` means never to draw the node
 * - a string means to draw the node IFF no other node with the same uri doesn't already exist.
 * */
export type NodeContextSpec = string | boolean

/**
 * A context in which a node was or was not drawn in.
 * - a string uniquely identifies a context the node was drawn in.
 * - `false` means that node was not drawn
 */
export type NodeContext = string | false

/** A builder that deduplicates within a specific context */
export abstract class DeduplicatingBuilder {
  protected readonly tracker = new ArrayTracker<number | string>()
  readonly #options: SharedOptions
  constructor(
    protected tree: PathTree,
    options: SharedOptions,
    protected graph: Graph<ModelNode, ModelEdge>,
  ) {
    this.#options = options
  }

  protected prepare(): void {}

  public build(): void {
    this.prepare()

    const nodeContexts = new Map<PathTreeNode, NodeContext[]>()
    for (const node of this.tree.walk()) {
      if (!(node instanceof Bundle || node instanceof Field)) {
        continue
      }
      let lastContext = this.#buildNode(nodeContexts, node)

      // default to nothing having been drawn
      if (typeof lastContext === 'undefined') {
        // TODO: concept count
        lastContext = [...new Array(node?.path?.conceptCount ?? 0)].map(
          () => false,
        )
      }
      nodeContexts.set(node, lastContext)
    }
  }

  /** checks if the given uri is included in the graph */
  #includesNode(node: PathTreeNode): boolean {
    if (this.#options.include == null) return true

    return this.#options.include(node)
  }

  #buildNode(
    nodeContexts: Map<PathTreeNode, NodeContext[]>,
    node: Bundle | Field,
  ): NodeContext[] | undefined {
    // skip nodes that aren't included
    if (node.path === null || !this.#includesNode(node)) return

    const { parent } = node
    const parentContext = parent !== null ? nodeContexts.get(parent) : undefined

    const contexts: NodeContext[] = []
    let context: NodeContext = false

    const elements = Array.from(node.elements())
    const drawConceptElement = (
      element: ConceptPathElement,
    ): number | undefined => {
      // find the context for the new element
      const newContextSpec = this.getConceptContext(
        element,
        context,
        node,
        parentContext ?? [],
      )

      // update the context
      context = this.#resolveContextSpec(newContextSpec)

      // and store that we used this context
      contexts.push(context)

      // if we're supposed to include the node
      if (context === false) {
        return
      }

      // generate the string id for this node
      // and check if we already have it
      const str = this.#makeID(context, 'class', element.uri)
      return this.graph.addOrUpdateNode(
        str,
        (label?: ModelNode | undefined): ModelNode => {
          return (
            label ?? {
              type: 'class',
              clz: element.uri,
              bundles: new ImmutableSet(),
              fields: new ImmutableSet(),
            }
          )
        },
      )
    }

    // draw all of the concepts
    const nodes = new Array<number | undefined>(elements.length)
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i]
      if (element.type === 'property') continue

      const id = drawConceptElement(element)
      nodes[i] = id
    }

    // draw all of the non-datatype properties
    for (let i = 1; i < elements.length; i += 2) {
      const element = elements[i]
      if (element.type === 'concept' || element.role === 'datatype') continue

      // ensure that both the previous and next nodes exist
      if (i <= 0 || i >= nodes.length - 1) {
        continue
      }

      // find the source and target nodes
      const sourceNode = nodes[i - 1]
      const targetNode = nodes[i + 1]
      if (
        typeof sourceNode === 'undefined' ||
        typeof targetNode === 'undefined'
      ) {
        continue
      }

      // If we already have this node, don't add it again
      // TODO: make this configurable?
      if (!this.tracker.add([sourceNode, targetNode, element.uri])) {
        continue
      }

      // and add the edge
      this.graph.addEdge(sourceNode, targetNode, {
        type: 'property',
        property: element.uri,
      })
    }

    // draw the datatype property (if any)
    if (node instanceof Field && node.path.datatypeProperty !== '') {
      ;(() => {
        if (elements.length === 0) return
        const dataElement = elements.find(
          (node): node is PropertyPathElement & { role: 'datatype' } =>
            node.role === 'datatype',
        )
        if (typeof dataElement === 'undefined') {
          console.warn('Missing datatype concept in node', node)
          return
        }

        const lastConcept = dataElement.index - 1
        if (lastConcept < 0 || lastConcept > nodes.length) {
          console.warn(
            'Missing final concept element to link to datatype',
            node,
          )
          return
        }

        const sourceConcept = elements[lastConcept]
        if (
          typeof sourceConcept === 'undefined' ||
          sourceConcept.type !== 'concept'
        ) {
          console.warn(
            'Final concept element not a concept, skipping datatype annotation',
            node,
          )
          return
        }
        const sourceNode = nodes[lastConcept]
        if (
          typeof sourceNode === 'undefined' ||
          typeof sourceConcept === 'undefined'
        ) {
          console.warn(
            'Final concept element not drawn in node, skipping datatype annotation',
            node,
          )
          return
        }

        // get the context to draw the datatype in
        const dtContextSpec = this.getDatatypeContext(
          dataElement,
          node,
          contexts[sourceConcept.conceptIndex] ?? false,
        )
        context = this.#resolveContextSpec(dtContextSpec)
        contexts.push(context)

        // no need to draw it
        if (context === false) return
        const id = this.#makeID(context, 'data', dataElement.uri)

        // add the field type
        const targetNode = this.graph.addOrUpdateNode(
          id,
          (label?: ModelNode | undefined): ModelNode => {
            if (label?.type === 'class') {
              throw new Error('never reached')
            }

            return {
              type: 'literal',
              fields: (label?.fields ?? new ImmutableSet([])).add(node),
            }
          },
        )

        // if we've already added the arrow, don't redraw
        // TODO: Do we want this configurable?
        if (!this.tracker.add([sourceNode, targetNode])) {
          return
        }

        // draw the new edge
        this.graph.addEdge(sourceNode, targetNode, {
          type: 'data',
          property: dataElement.uri,
        })
      })()
    }

    const updateLastConcept = (
      update: (node: ModelNode & { type: 'class' }) => ModelNode,
    ): void => {
      // the field is the last concept node
      const concept = elements
        .slice()
        .reverse()
        .find(node => node.type === 'concept')?.index

      if (typeof concept === 'undefined') {
        console.warn(
          'Missing final concept element in node (is it empty)?',
          node,
        )
        return
      }

      // get the actual id of the node
      const conceptNode = nodes[concept]
      if (typeof conceptNode === 'undefined') {
        console.warn(
          'Last concept not drawn in node, skipping annotation',
          node,
        )
        return
      }

      this.graph.addOrUpdateNode(conceptNode, label => {
        if (typeof label === 'undefined') {
          throw new Error('never reached')
        }

        if (label.type === 'literal') {
          throw new Error('never reached')
        }

        return update(label)
      })
    }

    // draw the datatype property (if any)
    if (node instanceof Field && node.path.datatypeProperty === '') {
      updateLastConcept(({ clz, bundles, fields, type }) => ({
        clz,
        bundles,
        fields: fields.add(node),
        type,
      }))
    }

    // draw the bundle (if any)
    if (node instanceof Bundle) {
      updateLastConcept(({ clz, bundles, fields, type }) => ({
        clz,
        bundles: bundles.add(node),
        fields,
        type,
      }))
    }

    return contexts
  }

  protected abstract getConceptContext(
    elem: ConceptPathElement,
    previous: NodeContext,
    node: Bundle | Field,
    parent: NodeContext[],
  ): NodeContextSpec

  protected abstract getDatatypeContext(
    elem: PropertyPathElement & { role: 'datatype' },
    node: Field,
    parent: NodeContext,
  ): NodeContextSpec

  /** makes an id for a node within a deduplication context */
  #makeID(context: string, typ: 'class' | 'data', id: string): string {
    return `context=${encodeURIComponent(context)}&typ=${encodeURIComponent(typ)}&id=${encodeURIComponent(id)}`
  }

  readonly #seenContexts = new Set<string>()
  #nextResolveID = 0
  #resolveContextSpec(next: NodeContextSpec): NodeContext {
    if (next === false) return false
    if (typeof next === 'string') {
      this.#seenContexts.add(next)
      return next
    }

    // iterate through numbers
    while (true) {
      const candidate = this.#nextResolveID.toString()
      this.#nextResolveID++

      if (!this.#seenContexts.has(candidate)) {
        this.#seenContexts.add(candidate)
        return candidate
      }
    }
  }
}
