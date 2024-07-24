import {
  Component,
  type JSX,
  type ComponentChildren,
  type ErrorInfo,
} from 'preact'
import { Operation } from '../lib/utils/operation'
import * as styles from './error.module.css'

import StackTrace from 'stacktrace-js'
import { classes } from '../lib/utils/classes'

interface State {
  error?: Error
  stack?: string
}

interface ErrorProps {
  error?: unknown
}
export default function ErrorDisplay({ error }: ErrorProps): JSX.Element {
  return (
    <div className={styles.display}>
      <ErrorDisplayAny error={error} />
    </div>
  )
}

function ErrorTitle(props: { title: string; message: string }): JSX.Element {
  const { title, message } = props
  return (
    <span class={classes(styles.line, styles.header)}>
      <span class={styles.title}>{title}</span>
      {message}
    </span>
  )
}

function ErrorDisplayAny(props: { error: unknown }): JSX.Element {
  const { error } = props
  if (!(error instanceof Error)) {
    return <ErrorTitle title='error' message={String(error)} />
  }
  return <ErrorDisplayError error={error} />
}

class ErrorDisplayError extends Component<{ error: Error }, State> {
  state: State = {}
  readonly #formatError = new Operation()

  readonly #doFormatError = (): void => {
    const { error } = this.props
    const ticket = this.#formatError.ticket()

    StackTrace.fromError(error)
      .then(frames => {
        if (!ticket()) return

        const stack = frames.map(sf => sf.toString()).join('\n')
        this.setState({ error, stack })
      })
      .catch(() => {
        if (!ticket()) return
        this.setState({ error, stack: undefined })
      })
  }

  componentDidMount(): void {
    this.#doFormatError()
  }

  componentWillUnmount(): void {
    this.#formatError.cancel()
  }

  componentDidUpdate(previousProps: typeof this.props): void {
    if (this.props.error !== previousProps.error) {
      this.#doFormatError()
    }
  }

  render(): ComponentChildren {
    const { error } = this.props
    const { error: sErr, stack: sStack } = this.state

    const stack = error === sErr ? sStack ?? sErr.stack : error.stack
    return (
      <>
        <ErrorTitle title={error.name} message={error.message} />

        {typeof stack === 'string' &&
          stack.split('\n').map((frame, index) => (
            <span key={index} class={styles.line}>
              {frame}
            </span>
          ))}
        {typeof error.cause !== 'undefined' && error.cause !== null && (
          <details>
            <summary>Cause</summary>
            <ErrorDisplayAny error={error.cause} />
          </details>
        )}
      </>
    )
  }
}

export class ErrorBoundary extends Component<
  { children: ComponentChildren },
  { error?: unknown }
> {
  state: { error?: ApplicationCrash } = {}

  componentDidCatch(error: any, info: ErrorInfo): void {
    this.setState({ error: new ApplicationCrash(error, info) })
  }

  /** remove the current error state and attempts to re-render the children */
  readonly #remount = (): void => {
    this.setState(({ error }) => {
      // if we didn't crash, don't do anything
      if (!(error instanceof ApplicationCrash)) return null

      // try to render again
      return { error: undefined }
    })
  }

  #enabled = false
  #enableAutoRemount(): void {
    if (this.#enabled) return
    import.meta.hot?.on('vite:afterUpdate', this.#remount)
    this.#enabled = true
  }
  #disableAutoRemount(): void {
    if (!this.#enabled) return
    import.meta.hot?.off('vite:afterUpdate', this.#remount)
    this.#enabled = false
  }

  componentDidUpdate(
    previousProps: typeof this.props,
    previousState: typeof this.state,
  ): void {
    // if we don't have a hot reload, don't bother
    if (typeof import.meta.hot === 'undefined') {
      return
    }

    // check that the error changed
    const { error } = this.state
    const { error: prevError } = previousState
    if (error === prevError) return

    // listen to changes only if there is an error
    if (typeof error !== 'undefined') {
      this.#enableAutoRemount()
    } else {
      this.#disableAutoRemount()
    }
  }

  componentWillUnmount(): void {
    this.#disableAutoRemount()
  }

  render(): ComponentChildren {
    const { error } = this.state
    if (error instanceof Error) {
      return <ErrorDisplay error={error} />
    }
    return this.props.children
  }
}

class ApplicationCrash extends Error {
  constructor(error: any, { componentStack }: ErrorInfo) {
    const err =
      error instanceof Error
        ? error
        : new Error(String(error), { cause: error })
    const message =
      typeof componentStack === 'string'
        ? 'An error occurred while rendering. \n' + componentStack
        : 'An unexpected error occurred. \n' + err.message

    super(message, { cause: err })

    this.stack = err.stack
    this.name = 'Application Crash: ' + err.name
  }

  readonly name: string
  readonly stack: string | undefined
}
