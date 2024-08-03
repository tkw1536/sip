import { Fragment, type ComponentChildren, type JSX } from 'preact'
import { useCallback, useId } from 'preact/hooks'
import GenericInput, {
  ariaEntries,
  datasetEntries,
  Label,
  type InputLikeProps,
} from './generic'
import useModifierRef from './generic/modifiers'

interface DropdownProps<T extends string> extends InputLikeProps<T> {
  /** titles of individual props */
  titles?: Partial<Record<T, string>>
  values?: T[]
}

export default function Dropdown<T extends string>({
  value,
  values,
  disabled,
  onInput,
  id,
  titles,
  form,
  ...rest
}: DropdownProps<T>): JSX.Element {
  const modifiers = useModifierRef()

  const isDisabled =
    (disabled ?? false) ||
    typeof value === 'undefined' ||
    typeof values === 'undefined'

  const handleChange = useCallback(
    (evt: Event & { currentTarget: HTMLSelectElement }): void => {
      evt.preventDefault()

      if (isDisabled || typeof onInput !== 'function') return

      // validate that we have a valid value
      const { value, dataset } = evt.currentTarget
      if (!(values?.includes(value as T) ?? false)) return

      // call the handler
      onInput(value as T, dataset, modifiers.current)
    },
    [isDisabled, onInput, values, modifiers],
  )

  return (
    <select
      id={id}
      value={value}
      disabled={isDisabled}
      onInput={handleChange}
      form={form}
      {...datasetEntries(rest)}
    >
      {(typeof values !== 'undefined' ? values : [value]).map(value => (
        <option key={value} value={value}>
          {titles?.[value] ?? value}
        </option>
      ))}
    </select>
  )
}

interface RadioProps<T extends string> extends DropdownProps<T> {
  descriptions?: Record<T, ComponentChildren>
}

export function Radio<T extends string>(props: RadioProps<T>): JSX.Element {
  const { value, values, disabled, onInput, titles, descriptions } = props

  const modifiers = useModifierRef()

  const isDisabled =
    (disabled ?? false) ||
    typeof value === 'undefined' ||
    typeof values === 'undefined'

  const handleChange = useCallback(
    (evt: Event & { currentTarget: HTMLInputElement }): void => {
      evt.preventDefault()
      if (isDisabled || typeof onInput !== 'function') return

      // validate that we have a valid value
      const { value, dataset } = evt.currentTarget
      if (!(values?.includes(value as T) ?? false)) return

      // call the handler
      onInput(value as T, dataset, modifiers.current)
    },
    [isDisabled, onInput, values, modifiers],
  )

  const name = useId()

  return (
    <>
      {(typeof values !== 'undefined' ? values : [value]).map(v => {
        const id = `${name}-value-${v}`
        const element = (
          <GenericInput
            name={name}
            id={id}
            type='radio'
            checked={value === v}
            value={v}
            onChange={handleChange}
            disabled={disabled}
            {...ariaEntries({
              disabled,
            })}
          />
        )

        const title = typeof v !== 'undefined' ? titles?.[v] ?? null : null
        const description =
          typeof v !== 'undefined' ? descriptions?.[v] ?? null : null
        return description !== null || title !== null ? (
          <p key={v}>
            {element}
            <Label id={id} title={title ?? undefined}>
              {description}
            </Label>
          </p>
        ) : (
          <Fragment key={v}>{element}</Fragment>
        )
      })}
    </>
  )
}
