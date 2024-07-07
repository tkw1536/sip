import { describe, expect, test } from 'vitest'
import { classes } from './classes'

describe(classes, () => {
  test('joins classes property', () => {
    expect(classes('hello', 'world')).toBe('hello world')
    expect(classes('is', '', undefined, false, 'included')).toBe('is included')
    expect(classes([null, undefined, 1234, ''])).toBe('')
  })
})
