import { type Inputs, useCallback } from 'preact/hooks'

/** wraps the given handler into a callback function that prevents defaults */
export default function useEventCallback<E extends Event, A extends any[], R>(
  fn: (event: E, ...rest: A) => R,
  inputs: Inputs,
): (event: E, ...rest: A) => R {
  return useCallback((event: E, ...rest: A) => {
    event.preventDefault()
    return fn(event, ...rest)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, inputs)
}
