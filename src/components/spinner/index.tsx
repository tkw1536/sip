import {
  type ComponentType,
  type ComponentChildren,
  type VNode,
  type JSX,
} from 'preact'
import * as styles from './index.module.css'
import { Lazy as LazyImpl } from '../wrapper'
import { useEffect, useState, type PropsWithoutRef } from 'preact/compat'

interface LoaderProps {
  message?: ComponentChildren
}
export default function Spinner({ message }: LoaderProps): VNode<any> {
  return (
    <AvoidFlicker>
      <div class={styles.spinner}>
        <div class={styles.logo} role='progressbar'>
          <div class={styles.glass} />
          <div class={styles.molecule} />
        </div>
        {typeof message !== 'undefined' && (
          <div class={styles.message}>{message}</div>
        )}
      </div>
    </AvoidFlicker>
  )
}

/** Like {@link Lazy} except that it uses the default spinner component */
export function LazyLoaded<P>(
  loader: () => Promise<ComponentType<P>>,
  message?: string,
): ComponentType<PropsWithoutRef<P>> {
  return LazyImpl(loader, <Spinner message={message} />)
}

function AvoidFlicker(props: {
  delayMS?: number
  children: JSX.Element | null
}): JSX.Element | null {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setVisible(true)
    }, props.delayMS ?? 1000)
    return () => {
      clearTimeout(timeout)
    }
  }, [props.delayMS])

  if (!visible) return null
  return props.children
}
