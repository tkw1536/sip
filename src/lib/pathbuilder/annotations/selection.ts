import { ImmutableMapWithDefault } from '../../utils/immutable-map'
import { filter, map } from '../../utils/iterable'
import { Path, Pathbuilder } from '../pathbuilder'
import { type PathTreeNode } from '../pathtree'

type Key = PathTreeNode | Path | undefined

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
  #selection: ImmutableMapWithDefault<string, boolean>
  private constructor (defaultValue: boolean, values: Iterable<string>) {
    this.#selection = new ImmutableMapWithDefault(defaultValue, map(values, str => [str, !defaultValue]))
  }

  get #defaultValue (): boolean {
    return this.#selection.defaultValue
  }

  toJSON (): NodeSelectionExport {
    const defaultValue = this.#defaultValue
    const values = map(filter(this.#selection, ([k, v]) => v !== defaultValue), ([k, v]) => k)
    return {
      type: 'node-selection',
      defaultValue,
      values: Array.from(values)
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
    return this.#selection.get(id)
  }

  /** with returns a new selection with the specified key set to the specified value */
  with (pairs: Iterable<[Key, boolean]>): NodeSelection {
    return this.#update(
      filter(
        map(pairs, ([k, v]) => {
          const id = toID(k)
          if (id === null) return null
          return [id, v]
        }),
        (v): v is [string, boolean] => v !== null
      )
    )
  }

  #update (values: Iterable<[string, boolean]>): NodeSelection {
    const selection = this.#selection.setAll(values)
    if (selection === this.#selection) {
      return this
    }

    const keys = map(selection.entries(), ([k, v]) => v !== this.#defaultValue ? k : null)
    return new NodeSelection(this.#defaultValue, filter(keys, k => k !== null))
  }

  toggle (key: Key): NodeSelection {
    const id = toID(key)
    if (id === null) return this

    return this.#update([[id, !this.includes(key)]])
  }

  /** returns a new pathbuilder consisting of the paths of the given node */
  toPathbuilder (node: PathTreeNode): Pathbuilder {
    return new Pathbuilder(Array.from(node.paths()).filter(p => this.includes(p)))
  }

  static none (): NodeSelection {
    return new NodeSelection(false, [])
  }

  static all (): NodeSelection {
    return new NodeSelection(true, [])
  }
}
