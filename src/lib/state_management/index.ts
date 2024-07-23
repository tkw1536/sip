import { Operation } from '../utils/operation'

export function withApply<T>(
  factory: (
    setState: SetState<Omit<T, 'apply'>>,
    getState: GetState<Omit<T, 'apply'>>,
  ) => Omit<T, 'apply'>,
): (
  setState: SetState<WithApplyT<T>>,
  getState: GetState<WithApplyT<T>>,
) => WithApplyT<Omit<T, 'apply'>> {
  return (setter, getter) => {
    const setState: SetState<Omit<T, 'apply'>> = partial => {
      const { apply, ...rest } = partial as Partial<T & { apply: unknown }>
      setter(rest as Partial<WithApplyT<T>>)
    }
    const getState: GetState<Omit<T, 'apply'>> = () => {
      const { apply, ...rest } = getter()
      return rest
    }

    return {
      ...factory(setState, getState),
      apply: apply(setState, getState),
    }
  }
}

type WithApplyT<T> = T & { apply: Apply<T> }

type SetState<S> = (state: Partial<S>) => void
type GetState<S> = () => S

type Apply<S> = (
  reducers: Reducer<S> | Array<Reducer<S>>,
  callback?: (error?: unknown) => void,
) => void
export type Reducer<T> = ReducerResult<T> | ReducerFunction<T>
type ReducerResult<S> = Partial<S> | null | Promise<Partial<S> | null>
type ReducerFunction<S> = (state: S) => ReducerResult<S>

function apply<S>(setState: SetState<S>, getState: GetState<S>): Apply<S> {
  const operation = new Operation()
  return (
    reducers: Reducer<S> | Array<Reducer<S>>,
    callback?: (error?: unknown) => void,
  ): void => {
    void applyReducers(
      operation.ticket(),
      setState,
      getState,
      Array.isArray(reducers) ? reducers : [reducers],
    ).then(callback, callback)
  }
}

async function applyReducers<S>(
  ticket: () => boolean,
  setState: SetState<S>,
  getState: GetState<S>,

  reducers: Array<Reducer<S>>,
): Promise<void> {
  for (const setter of reducers) {
    await applyReducer(ticket, setState, getState, setter)
  }
}

async function applyReducer<S>(
  ticket: () => boolean,
  setState: SetState<S>,
  getState: GetState<S>,

  reducer: Reducer<S>,
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    // a function to apply the new state
    const apply = (newState: Partial<S> | null): void => {
      if (newState === null) {
        return
      }

      if (!ticket()) {
        console.warn('apply: discarding state update')
        return
      }

      setState(newState)
      resolve()
    }

    // call the function, catching any errors
    let result: ReducerResult<S>
    try {
      result = typeof reducer === 'function' ? reducer(getState()) : reducer
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
      reject(err)
      return
    }

    if (!(result instanceof Promise)) {
      apply(result)
      return
    }

    // wait for the async case
    void result.then(apply, reject)
  })
}
