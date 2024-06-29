import { describe, expect, test } from '@jest/globals'
import { Operation } from './operation'

describe(Operation, () => {
  test('ticket returns true until new ticket is created', async () => {
    const N = 100

    const op = new Operation()

    // first ticket => always valid
    const first = op.ticket()
    for (let i = 0; i < N; i++) {
      expect(first()).toBe(true)
    }

    // second ticket => first ticket now invalid
    const second = op.ticket()
    for (let i = 0; i < N; i++) {
      expect(first()).toBe(false)
      expect(second()).toBe(true)
    }

    // third ticket => first and second ticket now invalid
    const third = op.ticket()
    for (let i = 0; i < N; i++) {
      expect(first()).toBe(false)
      expect(second()).toBe(false)
      expect(third()).toBe(true)
    }
  })
  test('all tickets return false after cancellation', async () => {
    const N = 100

    const op = new Operation()

    const first = op.ticket()

    // cancelation sets the canceled flag
    expect(op.canceled).toBe(false)
    op.cancel()
    expect(op.canceled).toBe(true)

    // existing ticket now false
    for (let i = 0; i < N; i++) {
      expect(first()).toBe(false)
    }

    // both old and new tickets are false
    const second = op.ticket()
    for (let i = 0; i < N; i++) {
      expect(first()).toBe(false)
      expect(second()).toBe(false)
    }
  })
})
