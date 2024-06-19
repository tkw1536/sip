/** ArrayTracker tracks if a set of array elements has been seen */
export default class ArrayTracker<T> {
  /** equality compares individual elements */
  private readonly equality: (l: T, r: T) => boolean
  constructor (equality?: (left: T, right: T) => boolean) {
    this.equality = equality ?? ((l, r) => l === r)
  }

  /** seen is the set of seen arrays */
  private readonly seen: T[][] = []

  /** add adds element unless it is already there */
  add (element: T[]): boolean {
    if (this.has(element)) return false // don't add it again!
    this.seen.push(element.slice(0)) // add it!
    return true
  }

  /** has checks if element is there  */
  has (element: T[]): boolean {
    return this.index(element) >= 0
  }

  /** index returns the index of the given element in the seen array */
  private index (element: T[]): number {
    return this.seen.findIndex(candidate => {
      // bail out if the element and candidate are not equal
      if (candidate.length !== element.length) {
        return false
      }

      // check if all elements are equal
      const nonEqualIndex = candidate.findIndex((canElement, index) => !this.equality(canElement, element[index]))
      return nonEqualIndex < 0
    })
  }
}
