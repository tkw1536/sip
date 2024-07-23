import { type Statement, type Store } from 'rdflib'
import GraphBuilder, { type Element } from '.'
import {
  type ObjectType,
  type PredicateType,
  type SubjectType,
} from 'rdflib/lib/types'
import { type NamespaceMap } from '../../pathbuilder/namespace'

type RenderMethod = (id: string, options: RDFOptions) => Element

export interface RDFNode {
  node: SubjectType | ObjectType
  render: RenderMethod
}
export interface RDFEdge {
  edge: PredicateType
  render: RenderMethod
}
export interface RDFOptions {
  ns: NamespaceMap
}

export default class RDFGraphBuilder extends GraphBuilder<
  RDFNode,
  RDFEdge,
  RDFOptions,
  never
> {
  readonly #store: Store
  constructor(store: Store) {
    super()
    this.#store = store
  }

  protected async doBuild(): Promise<void> {
    this.#store.statements.forEach(this.#addStatement)
  }

  readonly #addStatement = (statement: Statement): void => {
    const {
      subject: qSubject,
      predicate: qPredicate,
      object: qObject,
    } = statement
    // create a node for the subject (unless it already exists)
    const subject = this.graph.addNode(
      {
        node: qSubject,
        render: makeRenderMethod(qSubject),
      },
      RDFGraphBuilder.#subjectID(qSubject),
    )

    // create a node for the object (unless it already exists)
    const object = this.graph.addNode(
      {
        node: qObject,
        render: makeRenderMethod(qObject),
      },
      RDFGraphBuilder.#objectID(qObject),
    )

    // and add the edge
    this.graph.addEdge(subject, object, {
      edge: qPredicate,
      render: makeRenderMethod(qPredicate),
    })
  }

  static #subjectID(term: SubjectType): string {
    switch (term.termType) {
      case 'BlankNode':
        return 'b//' + term.id
      case 'NamedNode':
        return 'n//' + term.uri
      case 'Variable':
        return 'v//' + term.uri
    }
    throw new Error('never reached')
  }

  static #objectID(term: ObjectType): string | undefined {
    switch (term.termType) {
      case 'BlankNode':
      case 'NamedNode':
      case 'Variable':
        return this.#subjectID(term)
    }
    return undefined
  }
}

function makeRenderMethod(
  node: SubjectType | ObjectType | PredicateType,
): RenderMethod {
  return (id: string, options: RDFOptions) => {
    const element: Element = {
      id,
      label: null,
      tooltip: null,
      color: null,
    }
    switch (node.termType) {
      case 'BlankNode' /** fallthrough */:
        element.label = node.id
        element.tooltip = node.id
        element.color = 'yellow'
        break
      case 'NamedNode':
        element.label = options.ns.apply(node.uri)
        element.tooltip = node.uri
        element.color = 'green'
        break
      case 'Literal':
        // element.shape = 'box'
        element.label = node.value
        element.tooltip = node.termType
        element.color = 'blue'
        break
      case 'Variable':
        element.label = '?' + node.value
        element.tooltip = '?' + node.value
        element.color = 'red'
        break
      case 'Collection':
        element.label = 'Collection'
        element.tooltip = 'Collection'
        element.color = 'orange'
        break
      case 'Empty':
        element.label = 'Empty'
        element.tooltip = 'Empty'
        element.color = 'white'
        break
      default:
        throw new Error('never reached')
    }
    return element
  }
}
