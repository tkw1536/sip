import { type HTMLAttributes, type JSX } from 'preact/compat'
import { useCallback } from 'preact/hooks'

interface ActionButtonProps extends HTMLAttributes<HTMLButtonElement> {
  onClick?: () => void
}
export default function ActionButton({
  onClick,
  ...rest
}: ActionButtonProps): JSX.Element {
  const handleClick = useCallback(
    (event: Event) => {
      event.preventDefault()
      if (typeof onClick !== 'function') return
      onClick()
    },
    [onClick],
  )
  return <button {...rest} onClick={handleClick} />
}
