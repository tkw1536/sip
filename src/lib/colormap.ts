import { Bundle, Field, NodeLike } from './pathtree'

export default class ColorMap {
  constructor (public readonly defaultColor: string, private readonly colors: Map<string, string>) {
  }

  public static readonly globalDefault: string = '#ffffff'
  static empty (defaultColor?: string): ColorMap {
    return new ColorMap(defaultColor ?? ColorMap.globalDefault, new Map())
  }

  static generate (node: NodeLike, colors: { bundle: string, field: string }): ColorMap {
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

  /** gets the color of the node with the lowest depth and valid id */
  public get (...nodes: NodeLike[]): string {
    const node = nodes.sort(NodeLike.compare).find(node => typeof node.path?.id === 'string')
    return this.colors.get(node?.path?.id ?? '') ?? this.defaultColor
  }

  public set (node: NodeLike, color: string): ColorMap {
    const value = this.get(node)
    if (value === color) {
      return this
    }

    const id = node.path?.id
    if (typeof id === 'undefined') return this

    const copy = new Map(this.colors)
    if (color !== this.defaultColor) {
      copy.set(id, color)
    } else {
      copy.delete(id)
    }
    return new ColorMap(this.defaultColor, copy)
  }
}
