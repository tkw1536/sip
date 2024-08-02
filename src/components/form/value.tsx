import { type JSX } from 'preact/jsx-runtime'
import GenericInput, { datasetEntries, type InputLikeProps } from './generic'
import { useCallback, useMemo } from 'preact/hooks'
import useModifierRef from './generic/modifiers'
import ColorInstance from 'color'
import { type HTMLAttributes } from 'preact/compat'

interface ValueBasedInputProps<T> extends InputLikeProps<T> {
  extra: Partial<HTMLAttributes<HTMLInputElement>>
  setValue: (value: T) => HTMLAttributes<HTMLInputElement>['value']
  getValue: (element: HTMLInputElement) => T
}

function ValueBasedInput<T>({
  id,
  value,
  onInput,
  disabled,
  form,
  customValidity,
  reportValidity,
  setValue,
  getValue,
  extra,
  ...rest
}: ValueBasedInputProps<T>): JSX.Element {
  const modifiers = useModifierRef()
  const handleInput = useCallback(
    (event: Event & { currentTarget: HTMLInputElement }) => {
      event.preventDefault()
      if (typeof onInput !== 'function' || disabled === true) {
        return
      }
      const element = event.currentTarget
      onInput(getValue(element), element.dataset, modifiers.current)
    },
    [disabled, getValue, modifiers, onInput],
  )

  const raw = useMemo(() => {
    if (typeof value === 'undefined') {
      return undefined
    }
    return setValue(value as T)
  }, [setValue, value])

  return (
    <GenericInput
      {...extra}
      id={id}
      value={raw}
      form={form}
      onInput={handleInput}
      customValidity={customValidity}
      reportValidity={reportValidity}
      {...datasetEntries(rest)}
    />
  )
}

interface ColorProps extends InputLikeProps<string> {}

function setColor(color: string): string {
  return color
}
function getColor(element: HTMLInputElement): string {
  return new ColorInstance(element.value).hex()
}

export function Color(props: ColorProps): JSX.Element {
  const extra = useMemo(() => ({ type: 'color' }), [])
  return (
    <ValueBasedInput
      {...props}
      extra={extra}
      setValue={setColor}
      getValue={getColor}
    />
  )
}

interface NumericProps extends InputLikeProps<number> {
  min?: number
  max?: number
}

function setNumber(number: number): number {
  return number
}
function getNumber(element: HTMLInputElement): number {
  return element.valueAsNumber
}

export function Numeric({ min, max, ...props }: NumericProps): JSX.Element {
  const extra = useMemo(() => ({ type: 'number', min, max }), [min, max])
  return (
    <ValueBasedInput
      {...props}
      extra={extra}
      setValue={setNumber}
      getValue={getNumber}
    />
  )
}

interface TextProps extends InputLikeProps<string> {
  placeholder?: string
}

function setText(text: string): string {
  return text
}
function getText(element: HTMLInputElement): string {
  return element.value
}

export default function Text(props: TextProps): JSX.Element {
  const extra = useMemo(() => ({ type: 'text' }), [])
  return (
    <ValueBasedInput
      {...props}
      extra={extra}
      setValue={setText}
      getValue={getText}
    />
  )
}
