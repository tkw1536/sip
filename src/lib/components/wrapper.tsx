import { h, ComponentType } from 'preact'
import { useId } from 'preact/hooks'

export function WithID<T> (Component: ComponentType<Omit<T, 'id'> & { id: string }>): ComponentType<Omit<T, 'id'>> {
  return function (props: Omit<T, 'id'>) {
    return <Component {...props} id={useId()} />
  }
}
