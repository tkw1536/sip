import { Component, type ComponentChild } from 'preact'

interface ValueSelectorProps {
  values?: string[]
  value?: string
  onInput: (value: string) => void
}

export default class ValueSelector extends Component<ValueSelectorProps> {
  private readonly handleChange = (evt: Event & { currentTarget: HTMLSelectElement }): void => {
    evt.preventDefault()
    if (this.disabled) return

    // validate that we have a valid value
    const { value } = evt.currentTarget
    const { values, onInput } = this.props
    if (typeof values === 'undefined' || !values.includes(value)) return

    // call the handler
    onInput(value)
  }

  get disabled (): boolean {
    const { value, values } = this.props
    return typeof value === 'undefined' || typeof values === 'undefined'
  }

  render (): ComponentChild {
    const { value, values } = this.props
    if (typeof values === 'undefined') {
      return <select />
    }
    return (
      <select value={value} disabled={this.disabled} onInput={this.handleChange}>
        {
          values.map(value => <option key={value}>{value}</option>)
        }
      </select>
    )
  }
}
