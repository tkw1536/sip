import { type ComponentChild, type JSX, type VNode } from 'preact'
import { classes } from '../../lib/utils/classes'
import * as styles from './drop-area.module.css'
import { useCallback, useMemo, useRef, useState } from 'preact/hooks'
import Button from './button'

interface DropAreaProps {
  onInput: (...files: File[]) => void

  compact?: boolean
  disabled?: boolean

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

/**
 * Checks if files pass the given conditions
 *
 * @param types the types of files allowed, or undefined if all types should be permitted
 * @param multiple if multiple files are permitted
 * @param empty if no files are permitted
 * @param items the items to validate
 * @returns
 */
function validateFiles(
  types: string[] | undefined,
  multiple: boolean,
  empty: boolean = false,
  items:
    | ArrayLike<{ readonly type: string; readonly kind?: string }>
    | undefined,
): items is ArrayLike<{ readonly type: string }> {
  // check that we have the right number of elements
  if (typeof items === 'undefined' || items.length === 0) return empty
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

export default function DropArea(props: DropAreaProps): JSX.Element {
  const {
    class: clz,
    activeInvalidClass,
    activeValidClass,
    passiveClass,
    children,
    types,
    multiple,
    compact,
    disabled,
    onInput: onDropFile,
  } = props

  const [dragActive, setDragActive] = useState(false)
  const [dragValid, setDragValid] = useState(false)

  const callFileHandler = useMemo(
    () =>
      (files?: FileList): void => {
        if (
          !validateFiles(types, multiple ?? false, false, files) ||
          disabled === true
        )
          return
        onDropFile(...Array.from(files))
      },
    [disabled, multiple, onDropFile, types],
  )

  const handleDropFile = useCallback(
    (event: DragEvent): void => {
      event.preventDefault()
      if (disabled === true) return

      setDragActive(false)
      callFileHandler(event.dataTransfer?.files)
    },
    [disabled, callFileHandler],
  )

  const handleDropOver = useCallback(
    (event: DragEvent): void => {
      event.preventDefault()
      if (disabled === true) return

      setDragActive(true)
      setDragValid(
        validateFiles(
          types,
          multiple ?? false,
          true,
          event.dataTransfer?.items,
        ),
      )
    },
    [disabled, multiple, types],
  )

  const handleDragLeave = useCallback((event: DragEvent): void => {
    event.preventDefault()
    setDragActive(false)
    setDragValid(false)
  }, [])

  const fileInput = useRef<HTMLInputElement>(null)

  const handleClick = useCallback((): void => {
    const { current } = fileInput
    if (current === null || disabled === true) return
    current.click()
  }, [disabled])

  const handleUploadFile = useCallback(
    (event: Event): void => {
      event.preventDefault()
      if (disabled === true) return
      callFileHandler(fileInput?.current?.files ?? undefined)
    },
    [disabled, callFileHandler],
  )

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
    typeof children === 'function' ? children(dragActive, dragValid) : children

  let main: VNode
  if (!(compact ?? false)) {
    main = (
      <div
        class={classes(...dropClasses)}
        onDrop={handleDropFile}
        onDragOver={handleDropOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        {childNodes}
      </div>
    )
  } else {
    main = (
      <Button onInput={handleClick} disabled={disabled}>
        {childNodes}
      </Button>
    )
  }

  return (
    <>
      <input
        type='file'
        style={{ display: 'none' }}
        ref={fileInput}
        multiple={multiple}
        accept={types?.join(',')}
        onInput={handleUploadFile}
      />
      {main}
    </>
  )
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
