import { type JSX } from 'preact'
import { useCallback } from 'preact/hooks'

interface ValueSelectorProps {
  id?: string
  values?: string[]
  value?: string
  disabled?: boolean
  onInput: (value: string) => void
}

export default function ValueSelector(props: ValueSelectorProps): JSX.Element {
  const { id, value, values, disabled, onInput } = props
  const isDisabled =
    (disabled ?? false) ||
    typeof value === 'undefined' ||
    typeof values === 'undefined'

  const handleChange = useCallback(
    (evt: Event & { currentTarget: HTMLSelectElement }): void => {
      evt.preventDefault()
      if (isDisabled) return

      // validate that we have a valid value
      const { value } = evt.currentTarget
      if (!(values?.includes(value) ?? false)) return

      // call the handler
      onInput(value)
    },
    [isDisabled, values, onInput],
  )

  if (typeof values === 'undefined') {
    if (typeof value !== 'undefined') {
      return (
        <select id={id} value={value} disabled>
          <option>{value}</option>
        </select>
      )
    }
    return <select id={id} disabled />
  }

  return (
    <select id={id} value={value} disabled={isDisabled} onInput={handleChange}>
      {values.map(value => (
        <option key={value}>{value}</option>
      ))}
    </select>
  )
}
