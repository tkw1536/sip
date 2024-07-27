import { type RefObject } from 'preact'
import { useEffect, useRef, useState } from 'preact/hooks'

export interface Size {
  width: number
  height: number
}

/** returns a ref to be connected to an element for it's screen-visible size to be observed */
export default function useVisibleSize<E extends HTMLElement>(): [
  Size | null,
  RefObject<E>,
] {
  const [size, setSize] = useState<Size | null>(null)
  const elementRef = useRef<E>(null)

  useEffect(() => {
    if (elementRef.current === null) {
      throw new Error('useVisibleSize: element reference is not mounted')
    }

    const observer = new ResizeObserver(entries => {
      if (entries.length !== 1) {
        throw new Error('never reached')
      }
      setSize(getVisibleSize(entries[0].target))
    })
    observer.observe(elementRef.current)

    return () => {
      observer.disconnect()
      setSize(null)
    }
  }, [])

  return [size, elementRef]
}

function getVisibleSize(target: Element): Size {
  const { top, bottom, left, right } = target.getBoundingClientRect()

  return {
    width: Math.max(Math.min(right, window.innerWidth) - Math.max(left, 0), 0),
    height: Math.max(
      Math.min(bottom, window.innerHeight) - Math.max(top, 0),
      0,
    ),
  }
}
