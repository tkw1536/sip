/** Used to coordinate a set of function calls */
export class Operation {
  #id = 0
  #canceled = false

  /** ticket returns a function which returns true while ticket and cancel are not called again */
  ticket (): Ticket {
    if (this.canceled) {
      return (): boolean => false
    }

    const id = ++this.#id
    return (): boolean => !this.canceled && id === this.#id
  }

  /** returns true if cancel has been called */
  get canceled (): boolean {
    return this.#canceled
  }

  /** cancel cancels any ongoing tickets */
  cancel (): void {
    this.#canceled = true
  }
}

export type Ticket = () => boolean
export interface StateSetter<P, S, K extends keyof S> {
  (state: StateSetterArg<P, S, K>): Promise<void>
  ticket: Ticket
}
type StateSetterArg<P, S, K extends keyof S> = ((
  prevState: Readonly<S>,
  props: Readonly<P>
) => Pick<S, K> | Partial<S> | null)
| (Pick<S, K> | Partial<S> | null)
