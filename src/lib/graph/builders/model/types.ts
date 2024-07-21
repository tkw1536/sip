import type ColorMap from '../../../pathbuilder/annotations/colormap'
import { type NamespaceMap } from '../../../pathbuilder/namespace'
import { type Bundle, type Field } from '../../../pathbuilder/pathtree'
import type ImmutableSet from '../../../utils/immutable-set'

/** An element contains all information required for rendering */
interface Element {
  id: string
  label: string | null
  tooltip: string | null
  color: string | null
}

interface AttachedElement {
  node: Element
  edge: Element
}

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

  public render(
    id: string,
    options: ModelOptions,
  ): {
    element: Element
    attached?: {
      bundles: AttachedElement[]
      fields: AttachedElement[]
    }
  } {
    throw new Error('not implemented')
  }
}

export class LiteralModelNode {
  constructor(
    /** fields with a datatype property attached to this literal node */
    public readonly fields: ImmutableSet<Field>,
  ) {}

  public render(
    id: string,
    options: ModelOptions,
  ): {
    element: Element
    attached?: {
      fields: AttachedElement[]
    }
  } {
    throw new Error('not implemented')
  }
}

export type ModelEdge = PropertyModelEdge | DataModelEdge

export class PropertyModelEdge {
  constructor(
    /** the actual property */
    public property: string,
  ) {}

  render(id: string, options: ModelOptions): Element {
    return {
      id,
      label: options.display.Components.PropertyLabels
        ? options.ns.apply(this.property)
        : null,
      tooltip: options.display.Components.PropertyLabels ? this.property : null,
      color: null,
    }
  }
}

export class DataModelEdge {
  constructor(
    /** the actual property */
    public property: string,
  ) {}

  render(id: string, options: ModelOptions): Element {
    return {
      id,
      label: options.display.Components.DatatypePropertyLabels
        ? options.ns.apply(this.property)
        : null,
      tooltip: options.display.Components.DatatypePropertyLabels
        ? this.property
        : null,
      color: null,
    }
  }
}

export interface ModelOptions {
  ns: NamespaceMap
  cm: ColorMap
  display: ModelDisplay
}

export interface ModelDisplay {
  CompactBundles: boolean
  Components: {
    ConceptLabels: boolean
    PropertyLabels: boolean
    DatatypePropertyLabels: boolean
  }
}
