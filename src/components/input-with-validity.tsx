import {
  type ForwardedRef,
  forwardRef,
  type HTMLAttributes,
  type JSX,
  useEffect,
  useRef,
} from 'preact/compat'
import { useCombine } from '../lib/utils/ref'

interface InputWithValidityProps extends HTMLAttributes<HTMLInputElement> {
  /** a custom validity message to set for the element using {@link HTMLInputElement.setCustomValidity} */
  validity?: string

  /** if true, report the validity also if the element is not focused */
  forceReport?: boolean
}

export default forwardRef(function InputWithValidity(
  { validity, forceReport, ...rest }: InputWithValidityProps,
  ref: ForwardedRef<HTMLInputElement>,
): JSX.Element {
  const ourRef = useRef<HTMLInputElement>(null)
  const combinedRef = useCombine(ourRef, ref)

  useEffect(() => {
    const { current: input } = ourRef
    if (input === null) return

    input.setCustomValidity(validity ?? '')
    if ((forceReport ?? false) || document.activeElement === input) {
      input.reportValidity()
    }

    return () => {
      input.setCustomValidity('')
      input.reportValidity()
    }
  }, [validity, forceReport])

  return <input {...rest} ref={combinedRef} />
})
