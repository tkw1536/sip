/** @file implements array-like methods for iterators */

/** returns an iterator containing the entries of this iterator */
export function * entries<T> (iterable: Iterable<T>): IterableIterator<[number, T]> {
  let index = 0
  for (const value of iterable) {
    yield [index++, value]
  }
}

/** returns a new iterator that yields values of the passed through callback function */
export function * map<T, S> (iterable: Iterable<T>, callbackfn: (value: T, index: number, iterable: Iterable<T>) => S, thisArg?: any): IterableIterator<S> {
  for (const [index, value] of entries(iterable)) {
    yield callbackfn.call(thisArg, value, index, iterable)
  }
}

export function filter<T, S extends T> (iterable: Iterable<T>, predicate: (value: T, index: number, iterable: Iterable<T>) => value is S, thisArg?: any): IterableIterator<S>
export function filter<T> (iterable: Iterable<T>, predicate: (value: T, index: number, iterable: Iterable<T>) => boolean, thisArg?: any): IterableIterator<T>

/** returns a new iterator that yields only values which match predicate */
export function * filter<T> (iterable: Iterable<T>, predicate: (t: T, index: number, iterable: Iterable<T>) => boolean, thisArg?: any): IterableIterator<T> {
  for (const [index, value] of entries(iterable)) {
    const included = predicate.call(thisArg, value, index, iterable)
    if (!included) {
      continue
    }
    yield value
  }
}
