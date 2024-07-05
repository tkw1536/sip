import { describe, expect, test } from '@jest/globals'
import { sameValueZero } from './same-value-zero'

describe(sameValueZero, () => {
  test('behaves as specified', () => {
    const tests: Array<[any, any, boolean]> = [
      [undefined, undefined, true],
      [null, null, true],
      [true, true, true],
      [false, false, true],
      [true, false, false],
      ['foo', 'foo', true],
      [0, 0, true],
      [+0, -0, true],
      [+0, 0, true],
      [-0, 0, true],
      [0n, -0n, true],
      [0, false, false],
      ['', false, false],
      [0, false, false],
      ['', 0, false],
      ['0', 0, false],
      ['17', 17, false],
      [[1, 2], '1,2', false],
      [new String('foo'), 'foo', false], // eslint-disable-line no-new-wrappers
      [null, undefined, false],
      [null, false, false],
      [undefined, false, false],
      [{ foo: 'bar' }, { foo: 'bar' }, false],
      [new String('foo'), new String('foo'), false], // eslint-disable-line no-new-wrappers
      [0, null, false],
      [0, NaN, false],
      ['foo', NaN, false],
      [NaN, NaN, true],
      [undefined, undefined, true],
      [null, null, true]
    ]

    tests.forEach(([left, right, want]) => {
      expect(sameValueZero(left, right)).toBe(want)
    })
  })
})
