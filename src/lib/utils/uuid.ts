import { v4 as uuidv4 } from 'uuid'

export class UUIDPool<T extends number | string> {
  constructor (public readonly maxIter = 100_000) {}

  private readonly map = new Map<T, string>()
  private readonly seen = new Set<string>()

  /** returns the UUID for the given value */
  public for (value: T): string {
    const old = this.map.get(value)
    if (typeof old !== 'undefined') {
      return old
    }

    const id = this.next()
    this.map.set(value, id)
    return id
  }

  /** generates a new (previously unused) uuid */
  public next (): string {
    for (let i = 0; i < this.maxIter; i++) {
      const id = uuidv4()
      if (this.seen.has(id)) continue

      this.seen.add(id)
      return id
    }
    throw new Error('Exceeded maximum iterations without a new id')
  }
}

// spellchecker:words uuidv4
