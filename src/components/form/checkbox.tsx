import { type JSX, useCallback } from 'preact/compat'
import GenericInput, {
  ariaEntries,
  datasetEntries,
  type InputLikeProps,
} from './generic'
import useModifierRef from './generic/modifiers'

interface CheckboxProps extends InputLikeProps<boolean> {}

export default function Checkbox({
  value,
  disabled,
  onInput,
  id,
  customValidity,
  reportValidity,
  form,
  ...rest
}: CheckboxProps): JSX.Element {
  const modifiers = useModifierRef()

  const handleChange = useCallback(
    (event: Event & { currentTarget: HTMLInputElement }) => {
      event.preventDefault()

      if (disabled === true || typeof onInput !== 'function') return

      const { checked, dataset } = event.currentTarget
      onInput(checked, dataset, modifiers.current)
    },
    [disabled, modifiers, onInput],
  )

  return (
    <GenericInput
      type='checkbox'
      id={id}
      form={form}
      checked={value}
      disabled={disabled}
      onInput={handleChange}
      customValidity={customValidity}
      reportValidity={reportValidity}
      {...datasetEntries(rest)}
      {...ariaEntries({ disabled, customValidity, reportValidity })}
    />
  )
}
