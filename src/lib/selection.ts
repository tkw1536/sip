import { Path, Pathbuilder } from './pathbuilder'
import { type NodeLike } from './pathtree'

type Key = NodeLike | Path | undefined

/** toID turns a Key into an actual id */
function toID (key: Key): string | null {
  if (typeof key === 'undefined') return null
  const path = (key instanceof Path) ? key : key.path
  return path?.id ?? null
}

export interface NodeSelectionExport {
  type: 'node-selection'
  defaultValue: boolean
  values: string[]
}

export default class NodeSelection {
  private readonly set = new Set<string>()
  private constructor (private readonly defaultValue: boolean, values: Iterable<string>) {
    this.set = new Set(values)
  }

  toJSON (): NodeSelectionExport {
    return {
      type: 'node-selection',
      defaultValue: this.defaultValue,
      values: Array.from(this.set)
    }
  }

  private static isValidNodeSelection (data: any): data is NodeSelectionExport {
    if (!(('type' in data) && data.type === 'node-selection')) {
      return false
    }
    if (!(('defaultValue' in data) && typeof data.defaultValue === 'boolean')) {
      return false
    }
    if (!('values' in data)) {
      return false
    }
    const { values } = data
    return Array.isArray(values) && values.every(v => typeof v === 'string')
  }

  /** parses a colormap from json */
  static fromJSON (data: any): NodeSelection | null {
    if (!this.isValidNodeSelection(data)) {
      return null
    }

    return new NodeSelection(data.defaultValue, data.values)
  }

  /** includes checks if the selection includes the given key */
  includes (key: Key): boolean {
    const id = toID(key)
    if (id === null) return false

    if (this.set.has(id)) {
      return !this.defaultValue
    }
    return this.defaultValue
  }

  /** with returns a new selection with the specified key set to the specified value */
  with (pairs: Array<[Key, boolean]>): NodeSelection {
    const set = new Set(this.set)

    pairs.forEach(([key, value]) => {
      const id = toID(key)
      if (id === null) return

      if (value === this.defaultValue) {
        set.delete(id)
      } else {
        set.add(id)
      }
    })

    return new NodeSelection(this.defaultValue, set)
  }

  toggle (key: Key): NodeSelection {
    const id = toID(key)
    if (id === null) return this

    const set = new Set(this.set)

    if (set.has(id)) {
      set.delete(id)
    } else {
      set.add(id)
    }

    return new NodeSelection(this.defaultValue, set)
  }

  /** returns a new pathbuilder consisting of the paths of the given node */
  toPathbuilder (node: NodeLike): Pathbuilder {
    return new Pathbuilder(Array.from(node.paths()).filter(p => this.includes(p)))
  }

  static none (): NodeSelection {
    return new NodeSelection(false, [])
  }

  static all (): NodeSelection {
    return new NodeSelection(true, [])
  }
}
