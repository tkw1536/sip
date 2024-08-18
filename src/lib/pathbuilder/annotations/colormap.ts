import Color from 'color'
import { Bundle, Field, PathTreeNode } from '../pathtree'

export interface ColorMapExport {
  type: 'colormap'
  defaultColor: string
  colors: Record<string, string>
}

export default class ColorMap {
  public readonly defaultColor: string
  readonly #colors: Map<string, string>
  constructor(defaultColor: string, colors: Map<string, string>) {
    this.#colors = colors
    this.defaultColor =
      ColorMap.parseColor(defaultColor) ?? ColorMap.globalDefault
  }

  public static readonly globalDefault: string = '#ffffff'
  static empty(defaultColor?: string): ColorMap {
    return new ColorMap(defaultColor ?? ColorMap.globalDefault, new Map())
  }

  toJSON(): ColorMapExport {
    return {
      type: 'colormap',
      defaultColor: this.defaultColor,
      colors: Object.fromEntries(this.#colors),
    }
  }

  static isValidColorMap(data: unknown): data is ColorMapExport {
    return (
      typeof data === 'object' &&
      data !== null &&
      'type' in data &&
      data.type === 'colormap' &&
      'defaultColor' in data &&
      typeof data.defaultColor === 'string' &&
      'colors' in data &&
      data.colors instanceof Object &&
      Object.entries(data.colors as object).every(
        ([k, v]) => typeof k === 'string' && typeof v === 'string',
      )
    )
  }

  /** parses a colormap from json */
  static fromJSON(data: any): ColorMap | null {
    if (!this.isValidColorMap(data)) {
      return null
    }

    const colors = new Map<string, string>()
    Object.entries(data.colors).forEach(([k, v]) => {
      if (typeof v !== 'string') return

      const color = this.parseColor(v)
      if (typeof color !== 'string') return

      colors.set(k, color)
    })

    return new ColorMap(data.defaultColor, colors)
  }

  static generate(
    node: PathTreeNode,
    colors: { bundle: string; field: string },
  ): ColorMap {
    const cm = new Map<string, string>()
    for (const relative of node.walk()) {
      const id = relative.path?.id
      if (typeof id !== 'string') {
        continue
      }

      if (relative instanceof Bundle) {
        cm.set(id, colors.bundle)
        continue
      }
      if (relative instanceof Field) {
        cm.set(id, colors.field)
      }
    }
    return new ColorMap(ColorMap.globalDefault, cm)
  }

  static parseColor(color: string): string | null {
    try {
      return new Color(color).hex()
    } catch (e: any) {
      return null
    }
  }

  public getDefault(...nodes: PathTreeNode[]): string {
    return this.get(...nodes) ?? this.defaultColor
  }

  /** gets the color of the node with the lowest depth and valid id */
  public get(...nodes: PathTreeNode[]): string | null {
    const node = nodes
      .sort(PathTreeNode.compare.bind(PathTreeNode))
      .find(node => typeof node.path?.id === 'string')
    return this.#colors.get(node?.path?.id ?? '') ?? null
  }

  public set(node: PathTreeNode, color: string): ColorMap {
    const nColor = ColorMap.parseColor(color) ?? ColorMap.globalDefault

    const value = this.getDefault(node)
    if (value === nColor) {
      return this
    }

    const id = node.path?.id
    if (typeof id === 'undefined') return this

    const copy = new Map(this.#colors)
    if (nColor !== this.defaultColor) {
      copy.set(id, nColor)
    } else {
      copy.delete(id)
    }
    return new ColorMap(this.defaultColor, copy)
  }
}
