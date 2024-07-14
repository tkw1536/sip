import { describe, expect, test } from 'vitest'
import { entries, filter, find, map } from './iterable'

describe(entries, () => {
  test.each([[], [1, 2, 3, 4, 5], ['hello', 42], ['something', 'else']])(
    'entries %#',
    (...array: any[]) => {
      const got = entries(array)
      const want = array.entries()

      expect(Array.from(got)).toEqual(Array.from(want))
    },
  )
})

describe(filter, () => {
  test.each([
    [
      [],
      (value: string, index: number) => {
        throw new Error('never reached')
      },
    ],
    [['a', 'b', 'c'], () => true],
    [['a', 'b', 'c'], () => false],
    [['a', 'b', 'c'], (value: string, index: number) => index % 2 === 0],
  ])('filter %#', (array, predicate) => {
    const got = filter(array, predicate)
    const want = array.filter(predicate)

    expect(Array.from(got)).toEqual(Array.from(want))
  })
})

describe(map, () => {
  test.each([
    [
      [],
      (value: string, index: number) => {
        throw new Error('never reached')
      },
    ],
    [
      ['a', 'b', 'c'],
      (value: string, index: number) => value + value + index.toString(),
    ],
  ])('map %#', (array, callbackfn) => {
    const got = map(array, callbackfn)
    const want = array.map(callbackfn)

    expect(Array.from(got)).toEqual(Array.from(want))
  })
})

describe(find, () => {
  test.each([
    [
      [],
      (value: string, index: number) => {
        throw new Error('never reached')
      },
    ],
    [['a', 'b', 'c'], (elem: string) => elem === 'b'],
    [['a', 'b', 'c'], (elem: string, index: number) => index % 2 === 1],
    [['a', 'b', 'c'], (elem: string, index: number) => false],
  ])('find %#', (array, callbackfn) => {
    const got = find(array, callbackfn)
    const want = array.find(callbackfn)

    expect(got).toEqual(want)
  })
})
