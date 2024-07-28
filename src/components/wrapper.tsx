import { type ComponentType, type VNode } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import {
  type ForwardedRef,
  forwardRef,
  type PropsWithoutRef,
} from 'preact/compat'
import ErrorDisplay from './error'
import useAsyncState, { reasonAsCause } from './hooks/async'

/**
 * Lazily loads a component
 * @param loader Function that returns a promise which loads the component
 * @param fallback Component to display while the component is loading
 * @param fallbackDelay Delay for which not to show anything
 * @returns
 */
export function Lazy<P>(
  loader: () => Promise<ComponentType<P>>,
  fallback?: VNode<any> | null,
  fallbackDelay?: number,
): ComponentType<PropsWithoutRef<P>> {
  const shouldHideFallbackByDefault =
    typeof fallbackDelay === 'number' && fallbackDelay > 0

  const wrapper = forwardRef(
    (props: P, ref: ForwardedRef<unknown>): VNode<any> | null => {
      const component = useAsyncState(
        ticket => async () => {
          const Component = await loader()
          wrapper.displayName = `Lazy(${getDisplayName(Component)})`
          return Component
        },
        [],
        reasonAsCause('failed to load component'),
      )

      const [hideFallback, setHideFallback] = useState(
        shouldHideFallbackByDefault,
      )
      useEffect(() => {
        if (!shouldHideFallbackByDefault) {
          return
        }
        const timeout = setTimeout(() => {
          setHideFallback(false)
        }, fallbackDelay)

        return () => {
          clearTimeout(timeout)
        }
      })

      if (component.status === 'rejected') {
        return <ErrorDisplay error={component.reason} />
      }

      if (component.status === 'pending') {
        if (hideFallback) {
          return null
        }
        return fallback ?? null
      }

      const Component = component.value
      return <Component ref={ref} {...props} />
    },
  )
  wrapper.displayName = 'Lazy()'
  return wrapper
}

function getDisplayName(component: ComponentType<any>): string {
  return component.displayName ?? component.name ?? 'Component'
}
