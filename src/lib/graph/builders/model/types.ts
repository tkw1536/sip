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
    if (!options.display.ComplexConceptNodes) {
      const element = this.#renderSimple(id, options)
      return { element }
    }

    const { element, bundles, fields } = this.#renderComplex(id, options)
    if (bundles.length === 0 && fields.length === 0) {
      return { element }
    }

    return { element, attached: { fields, bundles } }
  }

  #renderSimple(id: string, options: ModelOptions): Element {
    const labelParts: string[] = []
    const tooltipParts: string[] = []

    if (options.display.Components.ConceptLabels) {
      labelParts.push(options.ns.apply(this.clz))
      tooltipParts.push(this.clz)
    }

    this.bundles.forEach(bundle => {
      labelParts.push('Bundle ' + bundle.path.name)
      tooltipParts.push('Bundle ' + bundle.path.id)
    })

    this.fields.forEach(field => {
      labelParts.push('Field ' + field.path.name)
      tooltipParts.push('Field ' + field.path.id)
    })

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

    const bundles = Array.from(this.bundles).map((bundle, idx) => {
      const bundleID = `${id}-bundle-${idx}`
      const color = options.cm.get(bundle)
      return {
        node: {
          id: bundleID + '-node',
          label: bundle.path.name,
          tooltip: bundle.path.id,
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
          label: 'Field ' + field.path.name,
          tooltip: field.path.id,
          color,
        },
        edge: {
          id: fieldID + '-edge',
          label: field.path.informativeFieldType,
          tooltip: field.path.fieldType,
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
  ): {
    element: Element
    attached?: {
      fields: AttachedElement[]
    }
  } {
    if (!options.display.ComplexLiteralNodes) {
      const element = this.#renderSimple(id, options)
      return { element }
    }

    const { element, fields } = this.#renderComplex(id, options)
    return { element, attached: { fields } }
  }

  #renderSimple(id: string, options: ModelOptions): Element {
    const label = Array.from(this.fields)
      .map(field => field.path.name)
      .join('\n\n')

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
            label: field.path.name,
            tooltip: field.path.id,
            color,
          },
          edge: {
            id: fieldID + '-edge',
            label: field.path.informativeFieldType,
            tooltip: field.path.fieldType,
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
    DatatypePropertyLabels: boolean
  }
}
