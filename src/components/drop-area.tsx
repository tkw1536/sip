import {
  Component,
  type ComponentChild,
  type JSX,
  type VNode,
  createRef,
} from 'preact'
import { classes } from '../lib/utils/classes'
import * as styles from './drop-area.module.css'

interface DropAreaProps {
  onDropFile: (...files: File[]) => void

  compact?: boolean

  class?: string
  activeValidClass?: string
  activeInvalidClass?: string
  passiveClass?: string

  multiple?: boolean
  types?: string[]

  children?:
    | ComponentChild
    | ((active: boolean, valid: boolean) => ComponentChild)
}

export default class DropArea extends Component<DropAreaProps> {
  readonly #callFileHandler = (files?: FileList): void => {
    if (!this.#validateFiles(files)) return
    this.props.onDropFile(...Array.from(files))
  }

  /** validateFiles checks if the given items or files are valid */
  readonly #validateFiles = (
    items?: ArrayLike<{ readonly type: string; readonly kind?: string }>,
    allowEmpty: boolean = false,
  ): items is ArrayLike<{ readonly type: string }> => {
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

  readonly #handleDropFile = (event: DragEvent): void => {
    event.preventDefault()
    this.setState({ dragActive: false })

    this.#callFileHandler(event.dataTransfer?.files)
  }

  readonly #handleDropOver = (event: DragEvent): void => {
    event.preventDefault()
    this.setState({
      dragActive: true,
      dragValid: this.#validateFiles(event.dataTransfer?.items, true),
    })
  }

  readonly #handleDragLeave = (event: DragEvent): void => {
    event.preventDefault()
    this.setState({ dragActive: false, dragValid: false })
  }

  readonly #handleClick = (event: MouseEvent): void => {
    event.preventDefault()

    const { current } = this.#fileInput
    if (current === null) return
    current.click()
  }

  readonly #handleUploadFile = (event: Event): void => {
    event.preventDefault()

    this.#callFileHandler(this.#fileInput?.current?.files ?? undefined)
  }

  readonly #fileInput = createRef<HTMLInputElement>()

  render(): ComponentChild {
    const { dragActive, dragValid } = this.state
    const {
      class: clz,
      activeInvalidClass,
      activeValidClass,
      passiveClass,
      children,
      multiple,
      types,
      compact,
    } = this.props

    // determine classes to apply
    const dropClasses = [clz]
    switch (true) {
      case dragActive && dragValid:
        dropClasses.push(activeValidClass)
        break
      case dragActive && !dragValid:
        dropClasses.push(activeInvalidClass ?? activeValidClass)
        break
      default:
        dropClasses.push(passiveClass)
    }

    const childNodes =
      typeof children === 'function'
        ? children(dragActive, dragValid)
        : children

    let main: VNode
    if (!(compact ?? false)) {
      main = (
        <div
          class={classes(...dropClasses)}
          onDrop={this.#handleDropFile}
          onDragOver={this.#handleDropOver}
          onDragLeave={this.#handleDragLeave}
          onClick={this.#handleClick}
        >
          {childNodes}
        </div>
      )
    } else {
      main = (
        <button class={classes(clz)} onClick={this.#handleClick}>
          {childNodes}
        </button>
      )
    }

    return (
      <>
        <input
          type='file'
          style={{ display: 'none' }}
          ref={this.#fileInput}
          multiple={multiple}
          accept={types?.join(',')}
          onInput={this.#handleUploadFile}
        />
        {main}
      </>
    )
  }
}

export function StyledDropArea(
  props: Omit<
    DropAreaProps,
    'class' | 'activeValidClass' | 'activeInvalidClass' | 'passiveClass'
  >,
): JSX.Element {
  return (
    <DropArea
      {...props}
      class={styles.area}
      activeValidClass={styles.valid}
      activeInvalidClass={styles.invalid}
    />
  )
}
