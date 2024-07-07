import { type ComponentType, type FunctionComponent } from 'preact'
import { useId } from 'preact/hooks'

export function WithID<T>(
  Component: ComponentType<Omit<T, 'id'> & { id: string }>,
): ComponentType<Omit<T, 'id'>> {
  const wrapper: FunctionComponent<Omit<T, 'id'>> = function (
    props: Omit<T, 'id'>,
  ) {
    return <Component {...props} id={useId()} />
  }
  wrapper.displayName = `WithID(${getDisplayName(Component)})`
  return wrapper
}

function getDisplayName(component: ComponentType<any>): string {
  return component.displayName ?? component.name ?? 'Component'
}
