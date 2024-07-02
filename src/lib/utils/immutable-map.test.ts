import { describe, expect, test } from '@jest/globals'
import ImmutableMap from './immutable-map'

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

  test('set() creates a new map with appropriate entries', () => {
    const mp = new ImmutableMap([[1, 'a'], [2, 'b'], [3, 'c']])

    const unchanged = mp.set(1, 'a')
    expect(Array.from(unchanged.entries())).toEqual([[1, 'a'], [2, 'b'], [3, 'c']])
    expect(Array.from(mp.entries())).toEqual([[1, 'a'], [2, 'b'], [3, 'c']])

    const add4 = mp.set(4, 'd')
    expect(Array.from(add4.entries())).toEqual([[1, 'a'], [2, 'b'], [3, 'c'], [4, 'd']])
    expect(Array.from(mp.entries())).toEqual([[1, 'a'], [2, 'b'], [3, 'c']])

    const replace3 = mp.set(2, 'B')
    expect(Array.from(replace3.entries())).toEqual([[1, 'a'], [2, 'B'], [3, 'c']])
    expect(Array.from(mp.entries())).toEqual([[1, 'a'], [2, 'b'], [3, 'c']])
  })

  test('delete() deletes entries and creates an independent map', () => {
    const mp = new ImmutableMap([[1, 'a'], [2, 'b'], [3, 'c']])

    const deleteNonExisting = mp.delete(4)
    expect(Array.from(deleteNonExisting.entries())).toEqual([[1, 'a'], [2, 'b'], [3, 'c']])
    expect(Array.from(mp.entries())).toEqual([[1, 'a'], [2, 'b'], [3, 'c']])

    const deleteExisting = mp.delete(3)
    expect(Array.from(deleteExisting.entries())).toEqual([[1, 'a'], [2, 'b']])
    expect(Array.from(mp.entries())).toEqual([[1, 'a'], [2, 'b'], [3, 'c']])
  })
})
