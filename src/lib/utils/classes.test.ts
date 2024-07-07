import { describe, expect, test } from 'vitest'
import { classes } from './classes'

describe(classes, () => {
  test.each([
    [['hello', 'world'], 'hello world'],
    [['is', '', undefined, false, 'included'], 'is included'],
    [[null, undefined, 1234, ''], '']
  ])('classes %#', (args, want) => {
    expect(classes(...args)).toBe(want)
  })
})
