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

  /** returns a new ImmutableMap with the value of K deleted */
  delete (key: K): ImmutableMap<K, V> {
    // if we don't have the key, return this map
    if (!this.has(key)) {
      return this
    }

    // create a new map and delete this key
    const entries = new Map(this)
    entries.delete(key)
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
    // value hasn't changed
    if (this.has(key) && this.get(key) === value) {
      return this
    }

    // delete the value from the map and return a new one
    const entries = new Map(this)
    entries.set(key, value)
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
    const values = entries !== null && typeof entries !== 'undefined' ? filterIterable(entries, ([k, v]) => v !== defaultValue) : entries
    super(values)
  }

  delete (key: K): ImmutableMapWithDefault<K, V> {
    if (!this.has(key)) {
      return this
    }
    // create a new map and delete this key
    const entries = new Map(this)
    entries.delete(key)
    return new ImmutableMapWithDefault(this.defaultValue, entries)
  }

  /** returns the value associated with the given key, or the default value. Note that object values may be mutable. */
  get (key: K): V {
    const value = super.get(key)
    if (typeof value === 'undefined') return this.defaultValue
    return value
  }

  /** set sets the key to the given value */
  set (key: K, value: V): ImmutableMapWithDefault<K, V> {
    if (value === this.defaultValue) {
      return this.delete(key)
    }
    if (this.has(key) && this.get(key) === value) {
      return this
    }

    const entries = new Map(this)
    entries.set(key, value)
    return new ImmutableMapWithDefault(this.defaultValue, entries)
  }
}

/** filters an iterable by the given predicate */
function * filterIterable<T> (iterable: Iterable<T>, predicate: (t: T) => boolean): IterableIterator<T> {
  for (const value of iterable) {
    if (!predicate(value)) {
      continue
    }
    yield value
  }
}