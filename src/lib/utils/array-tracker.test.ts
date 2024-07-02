import { describe, expect, test } from '@jest/globals'
import ArrayTracker from './array-tracker'

describe(ArrayTracker, () => {
  test('add works and returns the correct code', () => {
    const tracker = new ArrayTracker<number>()
    expect(tracker.add([])).toBe(true)
    expect(tracker.add([1])).toBe(true)
    expect(tracker.add([1, 2])).toBe(true)
    expect(tracker.add([1, 2, 3])).toBe(true)

    expect(tracker.add([])).toBe(false)
    expect(tracker.add([1])).toBe(false)
    expect(tracker.add([1, 2])).toBe(false)
    expect(tracker.add([1, 2, 3])).toBe(false)
  })

  test('has works and returns the right code', () => {
    const tracker = new ArrayTracker<number>()
    tracker.add([])
    tracker.add([1])
    tracker.add([1, 2])
    tracker.add([1, 2, 3])

    expect(tracker.has([])).toBe(true)

    expect(tracker.has([1])).toBe(true)
    expect(tracker.has([2])).toBe(false)

    expect(tracker.has([1, 2])).toBe(true)
    expect(tracker.has([2, 1])).toBe(false)
    expect(tracker.has([5, 6])).toBe(false)

    expect(tracker.has([1, 2, 3])).toBe(true)
    expect(tracker.has([3, 1, 2])).toBe(false)
    expect(tracker.has([4, 5, 6])).toBe(false)

    expect(tracker.has([1, 2, 3, 4])).toBe(false)
  })

  test('custom equality function works', () => {
    const tracker = new ArrayTracker<number>((l, r) => l % 2 === r % 2) // equality mod 2
    tracker.add([1])
    tracker.add([1, 2])

    expect(tracker.has([])).toBe(false)

    expect(tracker.has([1])).toBe(true)
    expect(tracker.has([5])).toBe(true)
    expect(tracker.has([2])).toBe(false)

    expect(tracker.has([1, 2])).toBe(true)
    expect(tracker.has([3, 4])).toBe(true)
    expect(tracker.has([2, 3])).toBe(false)
  })
})
