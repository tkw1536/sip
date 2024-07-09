import { Component, type ComponentChild } from 'preact'

interface ValueSelectorProps {
  values?: string[]
  value?: string
  disabled?: boolean
  onInput: (value: string) => void
}

export default class ValueSelector extends Component<
  ValueSelectorProps,
  Record<never, never>
> {
  readonly #handleChange = (
    evt: Event & { currentTarget: HTMLSelectElement },
  ): void => {
    evt.preventDefault()
    if (this.disabled) return

    // validate that we have a valid value
    const { value } = evt.currentTarget
    const { values, onInput } = this.props
    if (!(values?.includes(value) ?? false)) return

    // call the handler
    onInput(value)
  }

  get disabled(): boolean {
    const { value, values, disabled } = this.props
    return (
      (disabled ?? false) ||
      typeof value === 'undefined' ||
      typeof values === 'undefined'
    )
  }

  render(): ComponentChild {
    const { value, values } = this.props
    if (typeof values === 'undefined') {
      if (typeof value !== 'undefined') {
        return (
          <select value={value} disabled>
            <option>{value}</option>
          </select>
        )
      }
      return <select disabled />
    }
    return (
      <select
        value={value}
        disabled={this.disabled}
        onInput={this.#handleChange}
      >
        {values.map(value => (
          <option key={value}>{value}</option>
        ))}
      </select>
    )
  }
}
