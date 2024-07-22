import { type JSX } from 'preact'
import { useEffect, useRef } from 'preact/hooks'
import HTML from '../html'
import * as styles from './banner.module.css'
import markdownDocument from '../../../macros/markdown' with { type: 'macro' }

const bannerHTML = markdownDocument('banner.md')

interface ModalProps {
  onClose: (event: Event) => void
}

export default function Banner({ onClose }: ModalProps): JSX.Element {
  const modalRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const modal = modalRef.current
    if (modal === null) throw new Error('never reached')
    modal.showModal()
  }, [])

  return (
    <dialog ref={modalRef} onClose={onClose} class={styles.banner}>
      <form method='dialog'>
        <HTML html={bannerHTML} trim={false} noContainer />
        <div>
          <button type='submit'>I Understand And Wish To Continue</button>
        </div>
      </form>
    </dialog>
  )
}
