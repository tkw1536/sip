import { type ComponentType, type VNode } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import {
  type ForwardedRef,
  forwardRef,
  type PropsWithoutRef,
} from 'preact/compat'
import ErrorDisplay from './error'

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
      const [cState, setCState] = useState<{
        Component?: ComponentType<P>
        Error?: any
      }>({})

      useEffect(() => {
        let mounted = true

        loader().then(
          Component => {
            if (!mounted) return
            wrapper.displayName = `Lazy(${getDisplayName(Component)})`
            setCState({ Component, Error: undefined })
          },
          Error => {
            if (!mounted) return
            setCState({ Component: undefined, Error })
          },
        )

        return () => {
          mounted = false
        }
      }, [])

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

      const { Component, Error: loadError } = cState

      if (typeof loadError !== 'undefined') {
        return <ErrorDisplay error={loadError} />
      }

      if (typeof Component === 'undefined') {
        if (hideFallback) {
          return null
        }
        return fallback ?? null
      }

      return <Component ref={ref} {...props} />
    },
  )
  wrapper.displayName = 'Lazy()'
  return wrapper
}

function getDisplayName(component: ComponentType<any>): string {
  return component.displayName ?? component.name ?? 'Component'
}
