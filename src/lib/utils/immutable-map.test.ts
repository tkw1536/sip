import { describe, expect, test } from 'vitest'
import ImmutableMap, { ImmutableMapWithDefault } from './immutable-map'

describe(ImmutableMap, () => {
  test('has(), get(), size, keys(), values() and entries() work on a new map', () => {
    const mp = new ImmutableMap([[1, 'a'], [2, 'b'], [3, 'c']])

    expect(mp.has(1)).toBe(true)
    expect(mp.has(2)).toBe(true)
    expect(mp.has(3)).toBe(true)
    expect(mp.has(4)).toBe(false)

    expect(mp.get(1)).toBe('a')
    expect(mp.get(2)).toBe('b')
    expect(mp.get(3)).toBe('c')
    expect(mp.get(4)).toBeUndefined()

    expect(mp.size).toBe(3)

    expect(Array.from(mp.entries())).toEqual([[1, 'a'], [2, 'b'], [3, 'c']])
    expect(Array.from(mp)).toEqual([[1, 'a'], [2, 'b'], [3, 'c']])
    expect(Array.from(mp.keys())).toEqual([1, 2, 3])
    expect(Array.from(mp.values())).toEqual(['a', 'b', 'c'])
  })

  test('set() and setAll() create a new map with appropriate entries', () => {
    const original = new ImmutableMap([[1, 'a'], [2, 'b'], [3, 'c']])

    const unchanged = original.set(1, 'a')
    expect(Array.from(unchanged.entries())).toEqual([[1, 'a'], [2, 'b'], [3, 'c']])
    expect(Array.from(original.entries())).toEqual([[1, 'a'], [2, 'b'], [3, 'c']])

    const add4 = original.set(4, 'd')
    expect(Array.from(add4.entries())).toEqual([[1, 'a'], [2, 'b'], [3, 'c'], [4, 'd']])
    expect(Array.from(original.entries())).toEqual([[1, 'a'], [2, 'b'], [3, 'c']])

    const replace3 = original.set(2, 'B')
    expect(Array.from(replace3.entries())).toEqual([[1, 'a'], [2, 'B'], [3, 'c']])
    expect(Array.from(original.entries())).toEqual([[1, 'a'], [2, 'b'], [3, 'c']])

    const replaceMore = original.setAll([[1, 'A'], [2, 'B'], [3, 'C'], [4, 'D']])
    expect(Array.from(replaceMore.entries())).toEqual([[1, 'A'], [2, 'B'], [3, 'C'], [4, 'D']])
    expect(Array.from(original.entries())).toEqual([[1, 'a'], [2, 'b'], [3, 'c']])

    const laterWins = original.setAll([[1, 'A'], [2, 'B'], [3, 'C'], [4, 'D'], [1, 'aa']])
    expect(Array.from(laterWins.entries())).toEqual([[1, 'aa'], [2, 'B'], [3, 'C'], [4, 'D']])
    expect(Array.from(original.entries())).toEqual([[1, 'a'], [2, 'b'], [3, 'c']])
  })

  test('delete() and deleteAll() delete entries and creates an independent map', () => {
    const original = new ImmutableMap([[1, 'a'], [2, 'b'], [3, 'c']])

    const deleteNonExisting = original.delete(4)
    expect(Array.from(deleteNonExisting.entries())).toEqual([[1, 'a'], [2, 'b'], [3, 'c']])
    expect(Array.from(original.entries())).toEqual([[1, 'a'], [2, 'b'], [3, 'c']])

    const deleteExisting = original.delete(3)
    expect(Array.from(deleteExisting.entries())).toEqual([[1, 'a'], [2, 'b']])
    expect(Array.from(original.entries())).toEqual([[1, 'a'], [2, 'b'], [3, 'c']])

    const deleteMany = original.deleteAll([2, 3, 4])
    expect(Array.from(deleteMany.entries())).toEqual([[1, 'a']])
    expect(Array.from(original.entries())).toEqual([[1, 'a'], [2, 'b'], [3, 'c']])
  })
})

describe(ImmutableMapWithDefault, () => {
  test('has(), get(), size, keys(), values() and entries() work on a new map', () => {
    const mp = new ImmutableMapWithDefault('a', [[1, 'a'], [2, 'b'], [3, 'c']])

    expect(mp.has(1)).toBe(false)
    expect(mp.has(2)).toBe(true)
    expect(mp.has(3)).toBe(true)
    expect(mp.has(4)).toBe(false)

    expect(mp.get(1)).toBe('a')
    expect(mp.get(2)).toBe('b')
    expect(mp.get(3)).toBe('c')
    expect(mp.get(4)).toBe('a')

    expect(mp.size).toBe(2)

    expect(Array.from(mp.entries())).toEqual([[2, 'b'], [3, 'c']])
    expect(Array.from(mp)).toEqual([[2, 'b'], [3, 'c']])
    expect(Array.from(mp.keys())).toEqual([2, 3])
    expect(Array.from(mp.values())).toEqual(['b', 'c'])
  })

  test('set() and setAll() creates a new map with appropriate entries', () => {
    const original = new ImmutableMapWithDefault('d', [[1, 'a'], [2, 'b'], [3, 'c']])

    const unchanged = original.set(1, 'a')
    expect(Array.from(unchanged.entries())).toEqual([[1, 'a'], [2, 'b'], [3, 'c']])
    expect(Array.from(original.entries())).toEqual([[1, 'a'], [2, 'b'], [3, 'c']])

    const add4 = original.set(4, 'D')
    expect(Array.from(add4.entries())).toEqual([[1, 'a'], [2, 'b'], [3, 'c'], [4, 'D']])
    expect(Array.from(original.entries())).toEqual([[1, 'a'], [2, 'b'], [3, 'c']])

    const add5 = original.set(4, 'd')
    expect(Array.from(add5.entries())).toEqual([[1, 'a'], [2, 'b'], [3, 'c']])
    expect(Array.from(original.entries())).toEqual([[1, 'a'], [2, 'b'], [3, 'c']])

    const replace3 = original.set(2, 'B')
    expect(Array.from(replace3.entries())).toEqual([[1, 'a'], [2, 'B'], [3, 'c']])
    expect(Array.from(original.entries())).toEqual([[1, 'a'], [2, 'b'], [3, 'c']])

    const replaceMore = original.setAll([[1, 'A'], [2, 'B'], [3, 'C'], [4, 'D']])
    expect(Array.from(replaceMore.entries())).toEqual([[1, 'A'], [2, 'B'], [3, 'C'], [4, 'D']])
    expect(Array.from(original.entries())).toEqual([[1, 'a'], [2, 'b'], [3, 'c']])

    const laterWins = original.setAll([[1, 'A'], [2, 'B'], [3, 'C'], [4, 'D'], [1, 'aa']])
    expect(Array.from(laterWins.entries())).toEqual([[1, 'aa'], [2, 'B'], [3, 'C'], [4, 'D']])
    expect(Array.from(original.entries())).toEqual([[1, 'a'], [2, 'b'], [3, 'c']])
  })

  test('delete() and deleteAll() delete entries and creates an independent map', () => {
    const original = new ImmutableMapWithDefault('a', [[1, 'a'], [2, 'b'], [3, 'c']])

    const deleteNonExisting = original.delete(4)
    expect(Array.from(deleteNonExisting.entries())).toEqual([[2, 'b'], [3, 'c']])
    expect(Array.from(original.entries())).toEqual([[2, 'b'], [3, 'c']])

    const deleteExistingNonDefault = original.delete(3)
    expect(Array.from(deleteExistingNonDefault.entries())).toEqual([[2, 'b']])
    expect(Array.from(original.entries())).toEqual([[2, 'b'], [3, 'c']])

    const deleteExistingDefault = original.delete(1)
    expect(Array.from(deleteExistingDefault.entries())).toEqual([[2, 'b'], [3, 'c']])
    expect(Array.from(original.entries())).toEqual([[2, 'b'], [3, 'c']])

    const deleteMany = original.deleteAll([2, 3, 4])
    expect(Array.from(deleteMany.entries())).toEqual([])
    expect(Array.from(original.entries())).toEqual([[2, 'b'], [3, 'c']])
  })
})
