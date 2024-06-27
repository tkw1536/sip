import { Component, type ComponentChildren } from 'preact'
import { Operation } from '../utils/operation'

interface LoaderProps {
  message?: string
}
export class Loader extends Component<LoaderProps> {
  render (): ComponentChildren {
    const { message } = this.props
    return <AvoidFlicker>{message ?? 'Loading'}</AvoidFlicker>
  }
}

/** AvoidFlicker avoids showing children until after delayMS */
class AvoidFlicker extends Component<{ delayMs?: number, children: ComponentChildren }> {
  static readonly defaultDelayMs = 1000
  state = { visible: false }

  private readonly avoidFlicker = new Operation()
  componentDidMount (): void {
    const ticket = this.avoidFlicker.ticket()
    setTimeout(() => {
      if (!ticket()) return
      this.setState({ visible: true })
    }, this.props.delayMs ?? AvoidFlicker.defaultDelayMs)
  }

  componentWillUnmount (): void {
    this.avoidFlicker.cancel()
  }

  render (): ComponentChildren {
    const { visible } = this.state
    if (!visible) return false

    return this.props.children
  }
}
