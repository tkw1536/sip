import { filter } from './iterable'

/** An immutable map, where any change creates a new map instead of modifying the existing one */
export default class ImmutableMap<K, V> implements ReadonlyMap<K, V> {
  constructor (entries?: Iterable<[K, V]> | null) {
    this.#entries = new Map(entries)
  }

  #entries: Map<K, V>

  /** returns the key-value pairs in this map in insertion order */
  public entries (): IterableIterator<[K, V]> {
    return this.#entries.entries()
  }

  /** Returns an iterable of keys in the map */
  public keys (): IterableIterator<K> {
    return this.#entries.keys()
  }

  /** Returns an iterable of values in the map */
  public values (): IterableIterator<V> {
    return this.#entries.values()
  }

  /** Returns an iterable of entries in the map. */
  [Symbol.iterator] (): IterableIterator<[K, V]> {
    return this.entries()
  }

  /** Executes the provided function for each element of the function */
  forEach (callbackfn: (value: V, key: K, map: Map<K, V>) => void, thisArg?: any): void {
    this.#entries.forEach(callbackfn)
  }

  /** delete the specified key from the map */
  delete (key: K): ImmutableMap<K, V> {
    return this.deleteAll([key])
  }

  /** deletes the specified keys from this map */
  deleteAll (keys: Iterable<K>): ImmutableMap<K, V> {
    const entries = new Map(this)

    let modified = false
    for (const key of keys) {
      if (!entries.delete(key)) continue
      modified = true
    }

    if (!modified) return this
    return new ImmutableMap(entries)
  }

  /** returns the value associated with the given key, or undefined. Note that object values may not be mutable. */
  get (key: K): V | undefined {
    return this.#entries.get(key)
  }

  /** boolean indicating whether an element with the specified key exists or not. */
  has (key: K): boolean {
    return this.#entries.has(key)
  }

  /** Adds a new element with a specified key and value to the Map. If an element with the same key already exists, the element will be updated. */
  set (key: K, value: V): ImmutableMap<K, V> {
    return this.setAll([[key, value]])
  }

  /** Adds a set of new elements with the specified keys and values */
  setAll (values: Iterable<[K, V]>): ImmutableMap<K, V> {
    const entries = new Map(this)

    let modified = false
    for (const [key, value] of values) {
      // value hasn't changed
      if (entries.has(key) && entries.get(key) === value) {
        continue
      }

      // modify the value
      modified = true
      entries.set(key, value)
    }

    if (!modified) return this
    return new ImmutableMap(entries)
  }

  /** the number of element in this ImmutableMap */
  get size (): number {
    return this.#entries.size
  }
}

/** like an ImmutableMap,  */
export class ImmutableMapWithDefault<K, V> extends ImmutableMap<K, V> {
  constructor (public readonly defaultValue: V, entries?: Iterable<[K, V]> | null) {
    const values = entries !== null && typeof entries !== 'undefined' ? filter(entries, ([k, v]) => v !== defaultValue) : entries
    super(values)
  }

  delete (key: K): ImmutableMapWithDefault<K, V> {
    return this.deleteAll([key])
  }

  /** deletes the specified keys from this map */
  deleteAll (keys: Iterable<K>): ImmutableMapWithDefault<K, V> {
    const entries = new Map(this)

    let modified = false
    for (const key of keys) {
      if (!entries.delete(key)) continue
      modified = true
    }

    if (!modified) return this
    return new ImmutableMapWithDefault(this.defaultValue, entries)
  }

  /** returns the value associated with the given key, or the default value. Note that object values may be mutable. */
  get (key: K): V {
    const value = super.get(key)
    if (typeof value === 'undefined') return this.defaultValue
    return value
  }

  /** Adds a new element with a specified key and value to the Map. If an element with the same key already exists, the element will be updated. */
  set (key: K, value: V): ImmutableMapWithDefault<K, V> {
    return this.setAll([[key, value]])
  }

  setAll (values: Iterable<[K, V]>): ImmutableMapWithDefault<K, V> {
    const entries = new Map(this)

    let modified = false
    for (const [key, value] of values) {
      if (value === this.defaultValue) {
        // nothing changed
        if (!entries.has(key)) {
          continue
        }

        modified = true
        entries.delete(key)
        continue
      }

      // value hasn't changed
      if (entries.has(key) && entries.get(key) === value) {
        continue
      }

      // modify the value
      modified = true
      entries.set(key, value)
    }

    if (!modified) return this
    return new ImmutableMapWithDefault(this.defaultValue, entries)
  }
}
