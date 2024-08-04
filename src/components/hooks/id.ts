import { useId } from 'preact/hooks'

/** useOptionalID is like {@link useId}, but uses the user-supplied id if set */
export function useOptionalId(id?: string): string {
  const theID = useId()
  return typeof id === 'string' ? id : theID
}
