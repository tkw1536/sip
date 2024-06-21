import { h, Component, ComponentChild } from 'preact'

interface ValueSelectorProps {
  values?: string[]
  value?: string
  onInput: (value: string) => void
}

interface AsyncArraySelectorState {
  values?: string[]
}
export default class ValueSelector extends Component<ValueSelectorProps> {
  private readonly handleChange = (evt: Event & { currentTarget: HTMLSelectElement }): void => {
    evt.preventDefault()

    // validate that we have a valid value
    const { value } = evt.currentTarget 
    const { values, onInput } = this.props
    if (typeof values === 'undefined' || !values.includes(value)) return

    // call the handler
    onInput(value)
  }

  render (): ComponentChild {
    const { value, values } = this.props
    if (typeof values === 'undefined' || typeof value !== 'string') {
      return <select />
    }
    return (
      <select value={this.props.value} onInput={this.handleChange}>
        {
          values.map(value => <option key={value}>{value}</option>)
        }
      </select>
    )
  }
}
