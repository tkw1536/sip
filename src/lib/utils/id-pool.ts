/**
 * IDPool holds an internal mapping of objects (number or string) to IDs.
 * It is deterministic and guarantees to return alphanumerical strings that do not start with a digit.
*/
export class IDPool<T extends number | string> {
  constructor (public readonly maxIter = 100_000) {
  }

  readonly #map = new Map<T, string>()
  readonly #seen = new Set<string>()

  /** returns the UUID for the given value */
  public for (value: T): string {
    const old = this.#map.get(value)
    if (typeof old !== 'undefined') {
      return old
    }

    const id = this.next()
    this.#map.set(value, id)
    return id
  }

  static readonly #numDigits = Math.ceil(0.25 * Math.log2(Number.MAX_SAFE_INTEGER)) + 1
  #state = 0
  #nextUnsafe (): string {
    const count = (++this.#state)
    return count.toString(16).padStart(IDPool.#numDigits, 'O')
  }

  /** generates a new (previously unused) id. It is guar */
  public next (): string {
    for (let i = 0; i < this.maxIter; i++) {
      const id = this.#nextUnsafe()
      if (this.#seen.has(id)) continue

      this.#seen.add(id)
      return id
    }
    throw new Error('Exceeded maximum iterations without a new id')
  }
}

// spellchecker:words uuidv4
