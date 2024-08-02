import { type ComponentChildren, Fragment, toChildArray } from 'preact'
import { type JSX } from 'preact/compat'
import { useCallback, useRef } from 'preact/hooks'
import { datasetEntries, type InputLikeProps } from './generic'
import useModifierRef from './generic/modifiers'

interface ButtonProps<T> extends InputLikeProps<T | undefined> {
  children?: ComponentChildren
}

type ButtonPropsWithValue<T> = Omit<
  ButtonProps<T>,
  keyof InputLikeProps<T | undefined>
> &
  InputLikeProps<T>

function Button<T>(props: ButtonProps<T>): JSX.Element
function Button<T>(props: ButtonPropsWithValue<T>): JSX.Element
function Button<T>({
  onInput,
  id,
  value,
  disabled,
  children,
  form,
  ...rest
}: ButtonProps<T> | ButtonPropsWithValue<T>): JSX.Element {
  const modifiers = useModifierRef()
  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleClick = useCallback(
    (event: Event & { currentTarget: HTMLButtonElement }) => {
      event.preventDefault()
      if (typeof onInput !== 'function') {
        const { current: button } = buttonRef
        if (button instanceof HTMLButtonElement) {
          button.form?.requestSubmit(button)
        }
        return
      }
      if (disabled === true) {
        return
      }
      const { dataset } = event.currentTarget

      onInput(
        // @ts-expect-error value and first arg of onInput guaranteed to match by discrete type union
        value,
        dataset,
        modifiers.current,
      )
    },
    [disabled, modifiers, onInput, value],
  )
  return (
    <button
      onClick={handleClick}
      {...datasetEntries(rest)}
      form={form}
      ref={buttonRef}
    >
      {children}
    </button>
  )
}
export default Button

/** a group of multiple ActionButtons */
export function ButtonGroup(props: {
  children: ComponentChildren
  inline?: boolean
}): JSX.Element {
  const elements = toChildArray(props.children).map((child, idx) => (
    <Fragment key={idx}>
      {child}
      {` `}
    </Fragment>
  ))
  if (props.inline === true) return <>{elements}</>
  return <p>{elements}</p>
}

export function ButtonGroupText(props: {
  children: ComponentChildren
}): JSX.Element {
  return <span>{props.children}</span>
}
