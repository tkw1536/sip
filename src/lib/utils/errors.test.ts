import { describe, expect, test } from '@jest/globals'
import { formatError } from './errors'

describe(formatError, () => {
  test('formatError', () => {
    expect(formatError(new Error('hello world'))).toBe('hello world')
    expect(formatError('not an error')).toBe('not an error')
  })
})
