/**
 * Implements the SameValueZero algorithm to check if two values are identical.
 * It is used for set and map keys and map values.
 */
export function sameValueZero<T = any>(left: T, right: T): boolean {
  return (
    // regular equality
    left === right ||
    // special case: check if both numbers are NaN
    (typeof left === 'number' &&
      typeof right === 'number' &&
      isNaN(left) &&
      isNaN(right))
  )
}
