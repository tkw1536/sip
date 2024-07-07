import { describe, expect, test } from 'vitest'
import { entries, filter, map } from './iterable'

describe(entries, () => {
  test('produces array entries correctly', () => {
    const tests: any[][] = [
      [],
      [1, 2, 3, 4, 5],
      ['hello', 42],
      ['something', 'else']
    ]

    tests.forEach(array => {
      const got = entries(array)
      const want = array.entries()

      expect(Array.from(got)).toEqual(Array.from(want))
    })
  })
})

describe(filter, () => {
  test('filter filters correctly', () => {
    const tests: Array<[string[], (value: string, index: number) => boolean]> = [
      [[], (value, index) => { throw new Error('never reached') }],
      [['a', 'b', 'c'], () => true],
      [['a', 'b', 'c'], () => false],
      [['a', 'b', 'c'], (value, index) => index % 2 === 0]
    ]

    tests.forEach(([array, predicate]) => {
      const got = filter(array, predicate)
      const want = array.filter(predicate)

      expect(Array.from(got)).toEqual(Array.from(want))
    })
  })
})

describe(map, () => {
  test('map maps correctly', () => {
    const tests: Array<[string[], (value: string, index: number) => string]> = [
      [[], (value, index) => { throw new Error('never reached') }],
      [['a', 'b', 'c'], (value, index) => value + value + index.toString()]
    ]

    tests.forEach(([array, callbackfn]) => {
      const got = map(array, callbackfn)
      const want = array.map(callbackfn)

      expect(Array.from(got)).toEqual(Array.from(want))
    })
  })
})
