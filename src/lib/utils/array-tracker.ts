/**
 * Tracks arrays to check if they have been seen before
 */
export default class ArrayTracker<T> {
  /** equality compares individual elements */
  readonly #equality: (l: T, r: T) => boolean
  constructor (equality?: (left: T, right: T) => boolean) {
    this.#equality = equality ?? ((l, r) => l === r)
  }

  /** seen is the set of seen arrays */
  readonly #seen: T[][] = []

  /** add adds the element to the track, unless it has already been seen */
  add (element: T[]): boolean {
    if (this.has(element)) return false // don't add it again!
    this.#seen.push(element.slice(0)) // add it!
    return true
  }

  /** has checks if this ArrayTracker has already seen this array */
  has (element: T[]): boolean {
    return this.#seen.findIndex(candidate => (
      (candidate.length === element.length) && // same length
        candidate.every((cElement, index) => this.#equality(cElement, element[index])) // all elements equal
    )) >= 0
  }
}
