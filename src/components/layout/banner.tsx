import { type ComponentChildren, type JSX } from 'preact'
import { useCallback, useEffect, useRef } from 'preact/hooks'
import * as styles from './banner.module.css'
import Button from '../form/button'

interface ModalProps {
  children?: ComponentChildren
  buttonText?: ComponentChildren
  onClose: () => boolean
}

export default function UnClosableModal({
  onClose,
  children,
  buttonText,
}: ModalProps): JSX.Element {
  const modalRef = useRef<HTMLDialogElement>(null)

  // show the modal dialog on first render
  useEffect(() => {
    const modal = modalRef.current
    if (modal === null) throw new Error('never reached')
    modal.showModal()
  }, [])

  // do not allow the dialog element to be removed from the DOM by hand
  // this is not triggered by the cleanup
  useEffect(() => {
    const modal = modalRef.current
    if (modal === null) throw new Error('never reached')
    const parent = modal.parentElement
    if (parent === null) throw new Error('never reached')

    const observer = new MutationObserver(() => {
      if (!document.contains(modal)) {
        // eslint-disable-next-line no-self-assign
        location.href = location.href
      }
    })
    observer.observe(parent, { childList: true })

    return () => {
      observer.disconnect()
    }
  })

  const handleButton = useCallback(() => {
    modalRef.current?.close()
  }, [])

  const handleCancel = useCallback((event: Event) => {
    event.preventDefault()
  }, [])

  const handleClose = useCallback(
    (event: Event) => {
      event.preventDefault()

      if (!onClose()) {
        const modal = modalRef.current
        if (modal === null) throw new Error('never reached')

        // hack: on Chrome we need to re-open the dialog element
        // because preventDefault() is ineffective.
        queueMicrotask(() => {
          if (modal.open) return
          modal.showModal()
        })
      }
    },
    [onClose],
  )

  return (
    <dialog
      ref={modalRef}
      onCancel={handleCancel}
      onClose={handleClose}
      class={styles.banner}
    >
      {children}
      <Button onInput={handleButton}>{buttonText}</Button>
    </dialog>
  )
}
