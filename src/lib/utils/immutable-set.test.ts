import { describe, expect, test } from '@jest/globals'
import ImmutableSet from './immutable-set'

describe(ImmutableSet, () => {
  /** checks that the set immutable corresponds to the regular set */
  const assertSetIs = <T>(immutable: ImmutableSet<T>, set: Set<T>, keys?: T[]): void => {
    // equal size
    expect(immutable.size).toBe(set.size)

    // equal entries
    expect(Array.from(immutable.entries())).toEqual(Array.from(set.entries()))
    expect(Array.from(immutable.keys())).toEqual(Array.from(set.keys()))
    expect(Array.from(immutable.values())).toEqual(Array.from(set.values()))

    // check keys
    new Set([...(keys ?? []), ...set.keys()]).forEach(key => {
      expect(immutable.has(key)).toBe(set.has(key))
    })
  }

  test('adding and removing numbers works as expected', () => {
    const fullRange = [...Array(10).keys()]
    const evenRange = fullRange.filter(x => x % 2 === 0)
    const oddRange = fullRange.filter(x => x % 2 === 1)

    // start with an empty set
    const empty = new ImmutableSet<number>()
    assertSetIs(empty, new Set(), fullRange)

    // add all the numbers
    const allNumbers = empty.addAll(fullRange)
    assertSetIs(empty, new Set(), fullRange)
    assertSetIs(allNumbers, new Set(fullRange), fullRange)

    // adding them again does not add anything
    const stillAllNumbers = allNumbers.addAll(fullRange)
    assertSetIs(empty, new Set(), fullRange)
    assertSetIs(stillAllNumbers, new Set(fullRange), fullRange)

    // remove the odd numbers
    const evenNumbers = allNumbers.deleteAll(oddRange)
    assertSetIs(empty, new Set(), fullRange)
    assertSetIs(allNumbers, new Set(fullRange), fullRange)
    assertSetIs(evenNumbers, new Set(evenRange), fullRange)
  })
})
