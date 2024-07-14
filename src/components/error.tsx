import { Component, type ComponentChildren, type ErrorInfo } from 'preact'
import { Operation } from '../lib/utils/operation'
import * as styles from './error.module.css'

import StackTrace from 'stacktrace-js'
import { classes } from '../lib/utils/classes'

interface State {
  error?: Error
  stack?: string
}
export default class ErrorDisplay extends Component<{ error: unknown }> {
  render(): ComponentChildren {
    const { error } = this.props
    return (
      <div className={styles.display}>
        <ErrorDisplayAny error={error} />
      </div>
    )
  }
}

class ErrorTitle extends Component<{ title: string; message: string }> {
  render(): ComponentChildren {
    const { title, message } = this.props
    return (
      <span class={classes(styles.line, styles.header)}>
        <span class={styles.title}>{title}</span>
        {message}
      </span>
    )
  }
}

class ErrorDisplayAny extends Component<{ error: unknown }> {
  render(): ComponentChildren {
    const { error } = this.props
    if (!(error instanceof Error)) {
      return <ErrorTitle title='error' message={String(error)} />
    }
    return <ErrorDisplayError error={error} />
  }
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
  state: { error?: Error } = {}

  componentDidCatch(error: any, info: ErrorInfo): void {
    this.setState({ error: new ApplicationCrash(error, info) })
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
