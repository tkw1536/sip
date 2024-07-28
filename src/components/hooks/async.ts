import { type Inputs, useEffect } from 'preact/hooks'

/**
 * Like {@link useEffect}, but the effect function returns a promise.
 * Then either the onFulfilled or onRejected callback is executed, provided the effect has not already been cleaned up.
 * The cleanup function, if it is provided, is always executed, regardless if the promise itself is still pending or not.
 */
export default function useAsyncEffect<T>(
  effect: (ticket: () => boolean) => {
    promise: () => Promise<T>
    onFulfilled?: (value: T) => (() => void) | void
    onRejected?: (error: unknown) => (() => void) | void
    cleanup?: () => void
  },
  inputs: Inputs,
): void {
  useEffect(() => {
    let active = true
    let dynamicCleanup: (() => void) | void

    const { promise, onFulfilled, onRejected, cleanup } = effect(() => active)

    promise().then(
      value => {
        if (!active || typeof onFulfilled !== 'function') return
        dynamicCleanup = onFulfilled(value)
      },
      err => {
        if (!active || typeof onRejected !== 'function') return
        dynamicCleanup = onRejected(err)
      },
    )

    return () => {
      active = false
      if (typeof dynamicCleanup === 'function') {
        dynamicCleanup()
      }
      if (typeof cleanup === 'function') {
        cleanup()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, inputs)
}
