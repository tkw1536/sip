import { describe, expect, test, vi } from 'vitest'
import Once, { Lazy, LazyValue } from './once'

vi.useFakeTimers()

describe(Once, () => {
  test('Do() only calls the function once', async () => {
    let counter = 0

    const once = new Once()

    await once.Do(async () => {
      counter++
    })
    await once.Do(async () => {
      counter++
    })

    expect(counter).toBe(1)
  })
  test('Do() waits for execution to be complete', async () => {
    const THE_TIMEOUT = 1000
    for (let i = 0; i < 1000; i++) {
      const once = new Once()

      const all = Promise.all([
        once.Do(async () => {
          await new Promise(resolve => setTimeout(resolve, THE_TIMEOUT))
        }),
        once.Do(async () => {
          throw new Error('this should never be called')
        }),
      ])
      vi.runAllTimers()

      await all
    }
  })
})

describe(Lazy, () => {
  test('Get() executes only once', async () => {
    const lazy = new Lazy()

    const firstValue = await lazy.Get(async () => 1)
    expect(firstValue).toBe(1)

    const secondValue = await lazy.Get(async () => 2)
    expect(secondValue).toBe(1)
  })

  test('value holds the value after being loaded', async () => {
    const lazy = new Lazy()

    // no value before the first call
    expect(() => lazy.value).toThrow()

    // value after the first call
    await lazy.Get(async () => 1)
    expect(lazy.value).toBe(1)

    // same value after the second call
    await lazy.Get(async () => 2)
    expect(lazy.value).toBe(1)
  })
})

describe(LazyValue, () => {
  test('lazyValue calls the getter only once', async () => {
    let counter = 0
    const lazy = new LazyValue(async () => ++counter)

    const first = await lazy.lazyValue
    const second = await lazy.lazyValue

    expect(first).toBe(1)
    expect(second).toBe(1)
  })

  test('value holds the value after load', async () => {
    let counter = 0
    const lazy = new LazyValue(async () => ++counter)

    // no value before the first call
    expect(() => lazy.value).toThrow()

    await lazy.load()
    expect(lazy.value).toBe(1)
    expect(lazy.value).toBe(1) // intentionally check twice!
  })
})
