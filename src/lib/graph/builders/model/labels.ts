import type ColorMap from '../../../pathbuilder/annotations/colormap'
import { type NamespaceMap } from '../../../pathbuilder/namespace'
import { type Bundle, type Field } from '../../../pathbuilder/pathtree'
import type ImmutableSet from '../../../utils/immutable-set'

/** An element contains all information required for rendering */
export interface Element {
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
  ): Element & {
    attached?: {
      bundles: AttachedElement[]
      fields: AttachedElement[]
    }
  } {
    if (!options.display.ComplexConceptNodes) {
      return this.#renderSimple(id, options)
    }

    const { element, bundles, fields } = this.#renderComplex(id, options)
    if (bundles.length === 0 && fields.length === 0) {
      return element
    }

    return { ...element, attached: { fields, bundles } }
  }

  #renderSimple(id: string, options: ModelOptions): Element {
    const labelParts: string[] = []
    const tooltipParts: string[] = []

    if (options.display.Components.ConceptLabels) {
      labelParts.push(options.ns.apply(this.clz))
      tooltipParts.push(this.clz)
    }

    if (options.display.Components.BundleLabels) {
      this.bundles.forEach(bundle => {
        labelParts.push('Bundle ' + bundle.path.name)
        tooltipParts.push('Bundle ' + bundle.path.id)
      })
    }

    if (options.display.Components.ConceptFieldLabels) {
      this.fields.forEach(field => {
        labelParts.push('Field ' + field.path.name)
        tooltipParts.push('Field ' + field.path.id)
      })
    }

    return {
      id,
      label: labelParts.length > 0 ? labelParts.join('\n\n') : null,
      tooltip: tooltipParts.length > 0 ? tooltipParts.join('\n\n') : null,
      color: options.cm.get(...this.fields, ...this.bundles),
    }
  }

  #renderComplex(
    id: string,
    options: ModelOptions,
  ): {
    element: Element
    bundles: AttachedElement[]
    fields: AttachedElement[]
  } {
    const element = {
      id,
      label: options.display.Components.ConceptLabels
        ? options.ns.apply(this.clz)
        : null,
      tooltip: options.display.Components.ConceptLabels ? this.clz : null,
      color: null,
    }

    const { BundleLabels, ConceptFieldLabels, ConceptFieldTypes } =
      options.display.Components

    const bundles = Array.from(this.bundles).map((bundle, idx) => {
      const bundleID = `${id}-bundle-${idx}`
      const color = options.cm.get(bundle)
      return {
        node: {
          id: bundleID + '-node',
          label: BundleLabels ? bundle.path.name : null,
          tooltip: BundleLabels ? bundle.path.id : null,
          color,
        },
        edge: {
          id: bundleID + '-edge',
          label: null,
          tooltip: null,
          color,
        },
      }
    })

    const fields = Array.from(this.fields).map((field, idx) => {
      const fieldID = `${id}-field-${idx}`
      const color = options.cm.get(field)

      return {
        node: {
          id: fieldID + '-node',
          label: ConceptFieldLabels ? field.path.name : null,
          tooltip: ConceptFieldLabels ? field.path.id : null,
          color,
        },
        edge: {
          id: fieldID + '-edge',
          label: ConceptFieldTypes ? field.path.informativeFieldType : null,
          tooltip: ConceptFieldTypes ? field.path.fieldType : null,
          color,
        },
      }
    })

    return { element, bundles, fields }
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
  ): Element & {
    attached?: {
      fields: AttachedElement[]
    }
  } {
    if (!options.display.ComplexLiteralNodes) {
      return this.#renderSimple(id, options)
    }

    const { element, fields } = this.#renderComplex(id, options)
    return { ...element, attached: { fields } }
  }

  #renderSimple(id: string, options: ModelOptions): Element {
    const label = options.display.Components.DatatypeFieldLabels
      ? Array.from(this.fields)
          .map(field => field.path.name)
          .join('\n\n')
      : null

    return {
      id,
      label,
      tooltip: null,
      color: options.cm.get(...this.fields),
    }
  }

  #renderComplex(
    id: string,
    options: ModelOptions,
  ): {
    element: Element
    fields: AttachedElement[]
  } {
    const {
      Components: { DatatypeFieldLabels, DatatypeFieldTypes },
    } = options.display
    return {
      element: {
        id,
        label: null,
        tooltip: null,
        color: null,
      },
      fields: Array.from(this.fields).map((field, idx) => {
        const fieldID = `${id}-field-${idx}`
        const color = options.cm.get(field)
        return {
          node: {
            id: fieldID + '-node',
            label: DatatypeFieldLabels ? field.path.name : null,
            tooltip: DatatypeFieldLabels ? field.path.id : null,
            color,
          },
          edge: {
            id: fieldID + '-edge',
            label: DatatypeFieldTypes ? field.path.informativeFieldType : null,
            tooltip: DatatypeFieldTypes ? field.path.fieldType : null,
            color,
          },
        }
      }),
    }
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
  ComplexConceptNodes: boolean
  ComplexLiteralNodes: boolean
  Components: {
    ConceptLabels: boolean
    PropertyLabels: boolean

    BundleLabels: boolean
    ConceptFieldLabels: boolean
    ConceptFieldTypes: boolean

    DatatypeFieldTypes: boolean
    DatatypeFieldLabels: boolean
    DatatypePropertyLabels: boolean
  }
}

export function newModelDisplay(): ModelDisplay {
  return {
    ComplexConceptNodes: true,
    ComplexLiteralNodes: true,
    Components: {
      ConceptLabels: true,
      PropertyLabels: true,

      BundleLabels: true,
      ConceptFieldLabels: true,
      ConceptFieldTypes: true,

      DatatypeFieldTypes: true,
      DatatypeFieldLabels: true,
      DatatypePropertyLabels: true,
    },
  }
}
