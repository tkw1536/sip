/**
 * ImmutableSet represents a {@link Set} that cannot be changed.
 * Methods which would normally modify the set in-place instead create a new one.
 *
 * Some operations performed on immutable sets may result in the map itself.
 * Such operations include:
 * - Removing an element which is not in the set; and
 * - Adding an element already in the set
 */
export default class ImmutableSet<T> {
  constructor(values?: Iterable<T> | null) {
    this.#elements = new Set(values)
  }

  readonly #elements: Set<T>

  /* returns a new set with the given element added */
  add(value: T): ImmutableSet<T> {
    if (this.has(value)) return this
    const next = new Set(this.#elements)
    next.add(value)
    return new ImmutableSet(next)
  }

  /** like repeatedly calling {@link add} for each value of the iterator */
  addAll(values: Iterable<T>): ImmutableSet<T> {
    const elements = new Set(this.#elements)

    for (const value of values) {
      elements.add(value)
    }

    if (elements.size === this.#elements.size) return this
    return new ImmutableSet(elements)
  }

  /** returns a set with the given value removed */
  delete(value: T): ImmutableSet<T> {
    if (!this.has(value)) return this
    const next = new Set(this.#elements)
    next.delete(value)
    return new ImmutableSet(next)
  }

  /** like repeatedly calling {@link delete} for each value of the iterator */
  deleteAll(values: Iterable<T>): ImmutableSet<T> {
    const elements = new Set(this.#elements)

    for (const value of values) {
      elements.delete(value)
    }

    if (elements.size === this.#elements.size) return this
    return new ImmutableSet(elements)
  }

  /** calls callbackfn for each element in this set */
  forEach(
    callbackfn: (value: T, value2: T, set: Set<T>) => void,
    thisArg?: any,
  ): void {
    this.#elements.forEach(callbackfn, thisArg)
  }

  /** Returns an iterable of entries in the map. */
  [Symbol.iterator](): IterableIterator<T> {
    return this.#elements.keys()
  }

  /** iterates over all the entries in this set */
  entries(): IterableIterator<[T, T]> {
    return this.#elements.entries()
  }

  /** iterates over all the keys in this set */
  keys(): IterableIterator<T> {
    return this.#elements.keys()
  }

  /** same as keys */
  values(): IterableIterator<T> {
    return this.#elements.values()
  }

  /** returns if this set includes the specified value */
  has(value: T): boolean {
    return this.#elements.has(value)
  }

  /** the number of unique elements of this */
  get size(): number {
    return this.#elements.size
  }
}
