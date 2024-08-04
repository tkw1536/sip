import {
  type HTMLAttributes,
  type JSX,
  useCallback,
  useId,
} from 'preact/compat'
import GenericInput, {
  ariaEntries,
  datasetEntries,
  Label,
  type InputLikeProps,
} from './generic'
import useModifierRef from './generic/modifiers'
import { type ComponentChildren } from 'preact'

interface CheckboxProps extends InputLikeProps<boolean> {}

export default function Checkbox(props: CheckboxProps): JSX.Element {
  return <BooleanInput {...props} switch={false} />
}

interface SwitchProps extends CheckboxProps {
  title?: string
  children?: ComponentChildren
}

export function Switch({
  title,
  children,
  ...props
}: SwitchProps): JSX.Element {
  // automatically generate an id
  const autoID = useId()
  const theID = props.id ?? autoID

  return (
    <>
      <BooleanInput {...props} id={theID} switch={true} />
      <Label id={theID} title={title} children={children} />
    </>
  )
}

function BooleanInput({
  value,
  disabled,
  onInput,
  id,
  customValidity,
  reportValidity,
  form,
  switch: asSwitch,
  ...rest
}: CheckboxProps & { switch: boolean }): JSX.Element {
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

  const switchAriaRoles: {
    'role'?: HTMLAttributes<HTMLInputElement>['role']
    'aria-checked'?: boolean
  } = asSwitch ? { 'role': 'switch', 'aria-checked': value === true } : {}

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
      {...switchAriaRoles}
    />
  )
}
