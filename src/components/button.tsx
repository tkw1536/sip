import { type ComponentChildren, Fragment, toChildArray } from 'preact'
import { type HTMLAttributes, type JSX } from 'preact/compat'
import { useCallback } from 'preact/hooks'

interface ActionButtonProps
  extends Omit<HTMLAttributes<HTMLButtonElement>, 'onClick'> {
  native?: boolean
  onAction?: (button: HTMLButtonElement) => void
}
export default function ActionButton({
  onAction: onClick,
  native,
  ...rest
}: ActionButtonProps): JSX.Element {
  const handleClick = useCallback(
    (event: Event & { currentTarget: HTMLButtonElement }) => {
      if (native !== true) {
        event.preventDefault()
      }
      if (typeof onClick !== 'function') return
      onClick(event.currentTarget)
    },
    [native, onClick],
  )
  return <button {...rest} onClick={handleClick} />
}

/** a group of multiple ActionButtons */
export function ActionButtonGroup(props: {
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

export function ActionButtonGroupText(props: {
  children: ComponentChildren
}): JSX.Element {
  return <span>{props.children}</span>
}
