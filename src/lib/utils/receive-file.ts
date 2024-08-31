/**
 * receiveFileFromParent waits to receive a file from the frame parent.
 * If this window has no parent, no handler is set up.
 *
 * To achieve this, it installs an onMessage handler that receives a single message of the form {@link FileMessage} from the parent.
 * It then {@link window.postMessage}s 'tipsy:ready' to the parent to inform them that such a listener has been installed.
 *
 * @returns a function to remove and clean up any event handlers (if any).
 */
export default function receiveFileFromParent(
  onReceive: (file: File) => void,
): (() => void) | void {
  // no parent window
  if (window.top === window.self) return

  // create a handler for loading a file from the parent
  const handler = (evt: MessageEvent): void => {
    const { data, source } = evt
    if (source !== window.parent || !isFileMessage(data)) {
      return
    }
    window.removeEventListener('message', handler)
    onReceive(new File([data.data], data.filename, { type: data.type }))
  }
  window.addEventListener('message', handler)

  // inform the parent that we're ready
  window.parent.postMessage('tipsy:ready', '*')
  return () => {
    window.removeEventListener('message', handler)
  }
}

interface FileMessage {
  /** the name of the file */
  filename: string

  /** the media type of the file */
  type: string

  /** the data contained in the file */
  data: string
}

function isFileMessage(data: unknown): data is FileMessage {
  return (
    typeof data === 'object' &&
    data !== null &&
    'filename' in data &&
    typeof data.filename === 'string' &&
    'data' in data &&
    typeof data.data === 'string' &&
    'type' in data &&
    typeof data.type === 'string'
  )
}
