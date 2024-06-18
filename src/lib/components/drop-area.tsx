import { ComponentChild, Component, h, Fragment, createRef } from 'preact'

interface DropAreaProps {
  onDropFile: (...files: File[]) => void

  className?: string
  activeClassName?: string
  passiveClassName?: string

  multiple?: boolean
  types?: string[]

  children?: ComponentChild | ((active: boolean) => ComponentChild)
}

export default class DropArea extends Component<DropAreaProps> {
  private readonly callFileHandler = (files?: FileList): void => {
    if (typeof files === 'undefined' || files.length === 0) return

    if (!this.validateFiles(files)) return
    this.props.onDropFile(...Array.from(files))
  }

  private readonly validateFiles = (files: FileList): boolean => {
    if (files.length === 0) return false

    const { multiple, types } = this.props
    if (!(multiple ?? false) && files.length > 1) return false

    // check the types if defined
    if (typeof types === 'undefined' || types.length === 0) return true

    // check that each file has a valid suffix
    const suffixes = types.map(t => `.${t.toLowerCase()}`)
    for (let i = 0; i < files.length; i++) {
      const index = suffixes.findIndex(suffix => files[i].name.endsWith(suffix))
      if (index < -1) {
        return false
      }
    }

    return true
  }

  state = { dragActive: false }

  private readonly handleDropFile = (event: DragEvent): void => {
    event.preventDefault()
    this.setState({ dragActive: false })

    this.callFileHandler(event.dataTransfer?.files)
  }

  private readonly handleDropOver = (event: DragEvent): void => {
    event.preventDefault()
    this.setState({ dragActive: true })
  }

  private readonly handleDragExit = (event: DragEvent): void => {
    event.preventDefault()
    this.setState({ dragActive: false })
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
    const { dragActive } = this.state
    const { className, activeClassName, passiveClassName, children, multiple, types } = this.props
    const classes = `${className ?? ''} ${dragActive ? (activeClassName ?? '') : (passiveClassName ?? '')}`

    const accept = typeof types !== 'undefined' ? types.map(ext => `.${ext.toLowerCase()}`).join(',') : undefined
    const childNodes = typeof children === 'function' ? children(dragActive) : children

    return (
      <Fragment>
        <input
          type='file'
          style={{ display: 'none' }}
          ref={this.fileInput}
          multiple={multiple}
          accept={accept}
          onChange={this.handleUploadFile}
        />
        <div
          className={classes}
          onDrop={this.handleDropFile} onDragOver={this.handleDropOver} onDragExit={this.handleDragExit}
          onClick={this.handleClick}
        >{childNodes}
        </div>
      </Fragment>
    )
  }
}
