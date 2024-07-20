import type ColorMap from '../../../pathbuilder/annotations/colormap'
import { type NamespaceMap } from '../../../pathbuilder/namespace'
import { type Bundle, type Field } from '../../../pathbuilder/pathtree'
import type ImmutableSet from '../../../utils/immutable-set'

/** a node in the model graph */
export type ModelNode = ConceptModelNode | LiteralModelNode

export class ConceptModelNode {
  constructor(
    /** class represented at this node */
    public readonly clz: string,

    /** bundles with a defining concept at this node */
    public readonly bundles: ImmutableSet<Bundle>,

    /** fields without a datatype property attached to this node */
    public readonly fields: ImmutableSet<Field>,
  ) {}
}

export class LiteralModelNode {
  constructor(
    /** fields with a datatype property attached to this literal node */
    public readonly fields: ImmutableSet<Field>,
  ) {}
}

export type ModelEdge = PropertyModelEdge | DataModelEdge

abstract class ModelEdgeCommon {
  abstract label(options: ModelOptions): string | undefined
  abstract tooltip(options: ModelOptions): string | undefined
}

export class PropertyModelEdge extends ModelEdgeCommon {
  constructor(
    /** the actual property */
    public property: string,
  ) {
    super()
  }

  label({
    ns,
    display: {
      Components: { PropertyLabels },
    },
  }: ModelOptions): string | undefined {
    return PropertyLabels ? ns.apply(this.property) : undefined
  }
  tooltip({
    display: {
      Components: { PropertyLabels },
    },
  }: ModelOptions): string | undefined {
    return PropertyLabels ? this.property : undefined
  }
}

export class DataModelEdge extends ModelEdgeCommon {
  constructor(
    /** the actual property */
    public property: string,
  ) {
    super()
  }

  label({
    ns,
    display: {
      Components: { DatatypePropertyLabels },
    },
  }: ModelOptions): string | undefined {
    return DatatypePropertyLabels ? ns.apply(this.property) : undefined
  }
  tooltip({
    display: {
      Components: { DatatypePropertyLabels },
    },
  }: ModelOptions): string | undefined {
    return DatatypePropertyLabels ? this.property : undefined
  }
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
