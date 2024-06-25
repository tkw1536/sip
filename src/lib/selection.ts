import { NodeLike } from './pathtree'

export default class NodeSelection {
  private readonly set = new Set<string>()
  private constructor (private readonly defaultValue: boolean, values: Iterable<string>) {
    this.set = new Set(values)
  }

  /** includes checks if the selection includes the given key */
  includes (key: NodeLike): boolean {
    const id = key.path?.id
    if (typeof id !== 'string') return false
    if (this.set.has(id)) {
      return !this.defaultValue
    }
    return this.defaultValue
  }

  /** with returns a new selection with the specified key set to the specified value */
  with (pairs: Array<[NodeLike, boolean]>): NodeSelection {
    const set = new Set(this.set)

    pairs.forEach(([key, value]) => {
      const id = key.path?.id
      if (typeof id !== 'string') return

      if (value === this.defaultValue) {
        set.delete(id)
      } else {
        set.add(id)
      }
    })

    return new NodeSelection(this.defaultValue, set)
  }

  toggle (key: NodeLike): NodeSelection {
    const id = key.path?.id
    if (typeof id !== 'string') return this

    const set = new Set(this.set)

    if (set.has(id)) {
      set.delete(id)
    } else {
      set.add(id)
    }

    return new NodeSelection(this.defaultValue, set)
  }

  static none (): NodeSelection {
    return new NodeSelection(false, [])
  }

  static all (): NodeSelection {
    return new NodeSelection(true, [])
  }
}
