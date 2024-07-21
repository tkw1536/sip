import { Operation } from '../utils/operation'

/**
 * A function that updates a state object
 */
export type Reducer<State> =
  | Partial<State>
  | ((state: State) => Partial<State> | Promise<Partial<State> | null> | null)

/**
 * Props supplied to a context
 */
export interface ReducerProps<State> {
  state: State
  apply: (
    reducers: Reducer<State> | Array<Reducer<State>>,
    callback?: (error?: unknown) => void,
  ) => void
}

interface Setter<State> {
  (props: Partial<State> | null, callback?: () => void): void
  (func: (prev: State) => Partial<State> | null, callback?: () => void): void
}

/**
 * Manages and applies state
 */
export default class StateManager<State> {
  readonly #setState: Setter<State>
  constructor(setter: Setter<State>) {
    this.#setState = setter
  }

  readonly #reduction = new Operation()
  /** cancels any ongoing state changes */
  readonly cancel = this.#reduction.cancel.bind(this.#reduction)

  /** applies a reducer function */
  readonly #apply: ReducerProps<State>['apply'] = (
    reducers: Reducer<State> | Array<Reducer<State>>,
    callback?: (error?: unknown) => void,
  ): void => {
    const ticket = this.#reduction.ticket()

    this.#applyReducers(ticket, Array.isArray(reducers) ? reducers : [reducers])
      .then(() => {
        if (typeof callback === 'function') callback()
      })
      .catch(err => {
        if (typeof callback === 'function') callback(err)
      })
  }

  readonly #applyReducers = async (
    ticket: () => boolean,
    reducers: Array<Reducer<State>>,
  ): Promise<void> => {
    for (const reducer of reducers) {
      await this.#applyReducer(ticket, reducer)
    }
  }

  props(state: State): ReducerProps<State> {
    return {
      state,
      apply: this.#apply,
    }
  }

  readonly #applyReducer = async (
    ticket: () => boolean,
    reducer: Reducer<State>,
  ): Promise<void> => {
    await new Promise<void>(resolve => {
      let reducerReturnedPromise = false
      this.#setState(
        state => {
          if (!ticket()) return null

          // if we got an actual value, apply it now!
          const reduced =
            typeof reducer === 'function'
              ? (reducer as (state: State) => Partial<State>)(state)
              : reducer
          if (!(reduced instanceof Promise)) {
            return reduced
          }

          reduced
            .then(res => {
              this.#setState(() => (ticket() ? res : null), resolve)
            })
            .catch(err => {
              console.error('Error applying reducer')
              console.error(err)
            })

          reducerReturnedPromise = true
          return null // nothing to do for now (only when the promise resolves)
        },
        () => {
          if (!reducerReturnedPromise) {
            resolve()
          }
        },
      )
    })
  }
}
