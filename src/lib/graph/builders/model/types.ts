import type ColorMap from '../../../pathbuilder/annotations/colormap'
import { type NamespaceMap } from '../../../pathbuilder/namespace'
import { type Bundle, type Field } from '../../../pathbuilder/pathtree'
import type ImmutableSet from '../../../utils/immutable-set'

/** a node in the model graph */
export type ModelNode = ConceptModelNode | LiteralModelNode

interface ConceptModelNode {
  /* represents a single class node */
  type: 'class'
  clz: string

  /** bundles with a defining concept at this node */
  bundles: ImmutableSet<Bundle>

  /** fields without a datatype property attached to this class node */
  fields: ImmutableSet<Field>
}
interface LiteralModelNode {
  type: 'literal'

  /** fields with a datatype property attached to this literal node */
  fields: ImmutableSet<Field>
}

export type ModelEdge = PropertyModelEdge | DataModelEdge

/** A property node between two class nodes */
interface PropertyModelEdge {
  type: 'property'
  property: string
  // TODO: render the relevant paths, and their indexes
}

/** An edge between a class node and a datatype node */
interface DataModelEdge {
  type: 'data'
  property: string
  // TODO: render the relevant fields
}

export interface ModelOptions {
  ns: NamespaceMap
  cm: ColorMap
  display: ModelDisplay
}

export interface ModelDisplay {
  Components: {
    FreeConceptLabels: boolean
    PropertyLabels: boolean
    DatatypePropertyLabels: boolean
  }
}
