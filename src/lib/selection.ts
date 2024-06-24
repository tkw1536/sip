export default class Selection<S extends string = string> {
  private readonly set = new Set<S>()
  private constructor (private readonly defaultValue: boolean, values: Iterable<S>) {
    this.set = new Set(values)
  }

  /** includes checks if the selection includes the given key */
  includes (key: S): boolean {
    if (this.set.has(key)) {
      return !this.defaultValue
    }
    return this.defaultValue
  }

  /** with returns a new selection with the specified key set to the specified value */
  with (pairs: Array<[S, boolean]>): Selection {
    const set = new Set(this.set)

    pairs.forEach(([key, value]) => {
      if (value === this.defaultValue) {
        set.delete(key)
      } else {
        set.add(key)
      }
    })

    return new Selection(this.defaultValue, set)
  }

  toggle (value: S): Selection {
    const set = new Set(this.set)

    if (set.has(value)) {
      set.delete(value)
    } else {
      set.add(value)
    }

    return new Selection(this.defaultValue, set)
  }

  static none (): Selection {
    return new Selection(false, [])
  }

  static all (): Selection {
    return new Selection(true, [])
  }
}
