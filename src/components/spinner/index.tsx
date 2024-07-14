import { Component, type ComponentType, type ComponentChildren } from 'preact'
import { Operation } from '../../lib/utils/operation'
import * as styles from './index.module.css'
import { Lazy as LazyImpl } from '../wrapper'
import { type PropsWithoutRef } from 'preact/compat'

interface LoaderProps {
  message?: ComponentChildren
}
export default class Spinner extends Component<LoaderProps> {
  render(): ComponentChildren {
    const { message } = this.props
    return (
      <AvoidFlicker>
        <div class={styles.loader}>
          <div class={styles.logo} role='progressbar'>
            <div />
          </div>
          {typeof message !== 'undefined' && (
            <div class={styles.message}>{message}</div>
          )}
        </div>
      </AvoidFlicker>
    )
  }
}

/** Like {@link Lazy} except that it uses the default spinner component */
export function LazyLoaded<P>(
  loader: () => Promise<ComponentType<P>>,
  message?: string,
): ComponentType<PropsWithoutRef<P>> {
  return LazyImpl(loader, <Spinner message={message} />)
}

/** AvoidFlicker avoids showing children until after delayMS */
class AvoidFlicker extends Component<{
  delayMs?: number
  children: ComponentChildren
}> {
  static readonly defaultDelayMs = 1000
  state = { visible: false }

  readonly #avoidFlicker = new Operation()
  componentDidMount(): void {
    const ticket = this.#avoidFlicker.ticket()
    setTimeout(() => {
      if (!ticket()) return
      this.setState({ visible: true })
    }, this.props.delayMs ?? AvoidFlicker.defaultDelayMs)
  }

  componentWillUnmount(): void {
    this.#avoidFlicker.cancel()
  }

  render(): ComponentChildren {
    const { visible } = this.state
    if (!visible) return false

    return this.props.children
  }
}
