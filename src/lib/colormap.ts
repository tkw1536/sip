import { Bundle, Field, NodeLike } from './pathtree'

export default class ColorMap {
  constructor (private readonly defaultColor: string, private readonly colors: Map<string, string>) {
  }

  static empty (defaultColor: string): ColorMap {
    return new ColorMap(defaultColor, new Map())
  }

  static generate (node: NodeLike, colors: { bundle: string, field: string }): ColorMap {
    const cm = new Map<string, string>()
    for (const relative of node.walk()) {
      const id = relative.path()?.id
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
    return new ColorMap('#ffffff', cm)
  }

  public get (id: string): string {
    return this.colors.get(id) ?? this.defaultColor
  }

  public set (id: string, color: string): ColorMap {
    const value = this.get(id)
    if (value === color) {
      return this
    }
    const copy = new Map(this.colors)
    if (color !== this.defaultColor) {
      copy.set(id, color)
    } else {
      copy.delete(id)
    }
    return new ColorMap(this.defaultColor, copy)
  }
}
