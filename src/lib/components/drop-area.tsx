import { ComponentChild, Component, h, Fragment, createRef } from 'preact'

interface DropAreaProps {
  onDropFile: (...files: File[]) => void

  className?: string
  activeValidClassName?: string
  activeInvalidClassName?: string
  passiveClassName?: string

  multiple?: boolean
  types?: string[]

  children?: ComponentChild | ((active: boolean, valid: boolean) => ComponentChild)
}

export default class DropArea extends Component<DropAreaProps> {
  private readonly callFileHandler = (files?: FileList): void => {
    if (!this.validateFiles(files)) return
    this.props.onDropFile(...Array.from(files))
  }

  /** validateFiles checks if the given items or files are valid */
  private readonly validateFiles = (items?: ArrayLike<{ readonly type: string, readonly kind?: string }>, allowEmpty: boolean = false): items is ArrayLike<{ readonly type: string }> => {
    const { multiple, types } = this.props

    // check that we have the right number of elements
    if (typeof items === 'undefined' || items.length === 0) return allowEmpty
    if (!(multiple ?? false) && items.length > 1) return false

    // check each item
    const allowed = new Set(types ?? [])
    for (let i = 0; i < items.length; i++) {
      const item = items[i]

      // kind === 'file' (skipped if already a file)
      if (typeof item.kind === 'string' && item.kind !== 'file') return false

      // check against type list (skipped if not allowed)
      if (allowed.size > 0 && !allowed.has(item.type)) return false
    }

    // everything is valid!
    return true
  }

  state = { dragActive: false, dragValid: false }

  private readonly handleDropFile = (event: DragEvent): void => {
    event.preventDefault()
    this.setState({ dragActive: false })

    this.callFileHandler(event.dataTransfer?.files)
  }

  private readonly handleDropOver = (event: DragEvent): void => {
    event.preventDefault()
    this.setState({ dragActive: true, dragValid: this.validateFiles(event.dataTransfer?.items, true) })
  }

  private readonly handleDragLeave = (event: DragEvent): void => {
    event.preventDefault()
    this.setState({ dragActive: false, dragValid: false })
  }

  private readonly handleClick = (event: MouseEvent): void => {
    event.preventDefault()

    const { current } = this.fileInput
    if (current === null) return
    current.click()
  }

  private readonly handleUploadFile = (event: Event): void => {
    event.preventDefault()

    this.callFileHandler(this.fileInput?.current?.files ?? undefined)
  }

  private readonly fileInput = createRef<HTMLInputElement>()

  render (): ComponentChild {
    const { dragActive, dragValid } = this.state
    const { className, activeInvalidClassName, activeValidClassName, passiveClassName, children, multiple, types } = this.props

    // determine classes to apply
    const classes = [className]
    switch (true) {
      case dragActive && dragValid:
        classes.push(activeValidClassName)
        break
      case dragActive && !dragValid:
        classes.push(activeInvalidClassName ?? activeValidClassName)
        break
      default:
        classes.push(passiveClassName)
    }

    const childNodes = typeof children === 'function' ? children(dragActive, dragValid) : children

    return (
      <Fragment>
        <input
          type='file'
          style={{ display: 'none' }}
          ref={this.fileInput}
          multiple={multiple}
          accept={types?.join(',')}
          onChange={this.handleUploadFile}
        />
        <div
          className={classes.filter(clz => typeof clz === 'string').join(' ')}
          onDrop={this.handleDropFile} onDragOver={this.handleDropOver} onDragLeave={this.handleDragLeave}
          onClick={this.handleClick}
        >{childNodes}
        </div>
      </Fragment>
    )
  }
}
