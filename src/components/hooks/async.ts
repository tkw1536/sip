import { type Inputs, useEffect, useState } from 'preact/hooks'

export type AsyncState<V, R = unknown> =
  | { status: 'pending' }
  | PromiseFulfilledResult<V>
  | (PromiseRejectedResult & { reason: R })

function useAsyncState<V>(
  effect: (ticket: () => boolean) => () => Promise<V>,
  inputs: Inputs,
): AsyncState<V>
function useAsyncState<V, R>(
  effect: (ticket: () => boolean) => () => Promise<V>,
  inputs: Inputs,
  processReason: (reason: unknown) => R,
): AsyncState<V, R>
function useAsyncState<V, R>(
  effect: (ticket: () => boolean) => () => Promise<V>,
  inputs: Inputs,
  processReason?: (reason: unknown) => R,
): AsyncState<V, R> {
  const [state, setState] = useState<AsyncState<V, R>>({ status: 'pending' })

  useAsyncEffect(
    ticket => ({
      async promise() {
        return await effect(ticket)()
      },
      onFulfilled(value) {
        setState({ status: 'fulfilled', value })
      },
      onRejected(reason) {
        const theReason =
          typeof processReason === 'function'
            ? processReason(reason)
            : (reason as R)
        setState({ status: 'rejected', reason: theReason })
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    inputs,
  )

  return state
}
export default useAsyncState

export function reasonAsError(reason: unknown): Error {
  return reason instanceof Error ? reason : new Error(String(reason))
}
export function reasonAsCause(message?: string): (reason: unknown) => Error {
  return (cause: unknown) => {
    return new Error(message, { cause })
  }
}

/**
 * Like {@link useEffect}, but the effect function returns a promise.
 * Then either the onFulfilled or onRejected callback is executed, provided the effect has not already been cleaned up.
 * The cleanup function, if it is provided, is always executed, regardless if the promise itself is still pending or not.
 */
export function useAsyncEffect<T>(
  effect: (ticket: () => boolean) => {
    promise: () => Promise<T>
    onFulfilled?: (value: T) => (() => void) | void
    onRejected?: (reason: unknown) => (() => void) | void
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
      reason => {
        if (!active || typeof onRejected !== 'function') return
        dynamicCleanup = onRejected(reason)
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
