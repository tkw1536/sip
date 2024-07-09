import { type Statement, type Store } from 'rdflib'
import GraphBuilder from '.'
import {
  type ObjectType,
  type PredicateType,
  type SubjectType,
} from 'rdflib/lib/types'

export type RDFNode = SubjectType | ObjectType
export type RDFEdge = PredicateType

export default class RDFGraphBuilder extends GraphBuilder<RDFNode, RDFEdge> {
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
      qSubject,
      RDFGraphBuilder.#subjectID(qSubject),
    )

    // create a node for the object (unless it already exists)
    const object = this.graph.addNode(
      qObject,
      RDFGraphBuilder.#objectID(qObject),
    )

    // and add the edge
    this.graph.addEdge(subject, object, qPredicate)
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
