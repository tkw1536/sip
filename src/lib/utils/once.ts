/** Once calls the underlying function once  */
export default class Once {
  private started = false
  private done = false
  private waiters: Array<{ resolve: () => void, reject: (err: any) => void }> = []
  async Do (func: () => Promise<void>): Promise<void> {
    return await new Promise((resolve, reject) => {
      // everything is done already => don't do anything
      if (this.done) {
        resolve()
        return
      }

      // add a waiter to the front
      this.waiters.unshift({ resolve, reject })

      // if we've already started, don't start it again
      if (this.started) {
        return
      }

      this.started = true // start the function call
      func()
        .then(() => {
          this.done = true
          this.waiters.forEach(({ resolve }) => resolve())
        }).catch((err: any) => {
          if (this.done) { throw err } // error occurred during handling => re-throw it

          // error occurred during original promise
          this.done = true
          this.waiters.forEach(({ reject }) => reject(err))
        }).finally(() => {
          this.waiters = [] // prevent memory leaks for the resolve/reject
        })
    })
  }
}

/** Lazy computes a specific value once */
export class Lazy<T> {
  private readonly once = new Once()
  private stored: T | null = null
  async Get (getter: () => Promise<T>): Promise<T> {
    await this.once.Do(async () => {
      this.stored = await getter()
    })

    if (this.stored === null) {
      throw new Error('internal error: value not stored')
    }

    return this.stored
  }

  get value (): T {
    if (this.stored === null) throw new Error('Lazy: Value not loaded')
    return this.stored
  }
}

export class LazyValue<T> {
  private readonly lazy = new Lazy<T>()
  constructor (private readonly getter: () => Promise<T>) {
  }

  get value (): T {
    return this.lazy.value
  }

  async load (): Promise<void> {
    await this.lazyValue
  }

  get lazyValue (): Promise<T> {
    return this.lazy.Get(this.getter)
  }
}
