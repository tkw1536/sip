import { type JSX } from 'preact'
import { NamespaceMap } from '../lib/pathbuilder/namespace'
import { Type } from '../lib/utils/media'
import download from '../lib/utils/download'
import DropArea from './drop-area'
import ErrorDisplay from './error'
import * as styles from './namespace-editor.module.css'
import { Operation } from '../lib/utils/operation'
import { classes } from '../lib/utils/classes'
import { useCallback, useEffect, useId, useMemo, useState } from 'preact/hooks'

interface NamespaceEditorProps {
  ns: NamespaceMap
  onReset: () => void
  onUpdate: (ns: NamespaceMap) => void
}

export default function NamespaceEditor(
  props: NamespaceEditorProps,
): JSX.Element {
  const { onUpdate, ns, onReset } = props
  const [loadError, setLoadError] = useState<any>(undefined)

  const doUpdate = useCallback(
    (newNS: NamespaceMap) => {
      setLoadError(undefined)

      if (newNS === ns) return
      onUpdate(newNS)
    },
    [ns, onUpdate],
  )

  const handleUpdate = useCallback(
    (
      short: string,
      newShort: string | undefined,
      newLong: string | undefined,
    ): void => {
      let newNS = ns
      if (typeof newLong === 'string') {
        newNS = newNS.update(short, newLong)
      }
      if (typeof newShort === 'string') {
        newNS = newNS.rename(short, newShort)
      }
      doUpdate(newNS)
    },
    [doUpdate, ns],
  )

  const handleAdd = useCallback(
    (short: string, long: string): void => {
      setLoadError(undefined)

      doUpdate(ns.add(short, long))
    },
    [doUpdate, ns],
  )

  const handleDelete = useCallback(
    (long: string): void => {
      doUpdate(ns.remove(long))
    },
    [doUpdate, ns],
  )

  const operation = useMemo(() => new Operation(), []) // TODO: Figure out what to put here
  useEffect(() => () => {
    operation.cancel()
  })

  const loadNS = useCallback(
    (file: File) => {
      void (async () => {
        const ticket = operation.ticket()
        let ns: NamespaceMap
        try {
          const data = JSON.parse(await file.text())
          const newNS = NamespaceMap.fromJSON(data)
          if (newNS === null) throw new Error('not a valid namespace map')
          ns = newNS
        } catch (e: unknown) {
          if (!ticket()) return
          setLoadError(e)
          return
        }

        if (!ticket()) return
        doUpdate(ns)
      })()
    },
    [doUpdate, operation],
  )

  return (
    <table class={classes(styles.table)}>
      <thead>
        <tr>
          <th>NS</th>
          <th>URI</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {Array.from(ns).map(([short, long]) => (
          <MapViewRow
            ns={ns}
            long={long}
            short={short}
            key={short}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        ))}
        <AddMapRow ns={ns} onAdd={handleAdd} />
        <ControlsRow
          ns={ns}
          nsLoadError={loadError}
          onReset={onReset}
          onLoad={loadNS}
        />
      </tbody>
    </table>
  )
}

interface AddRowProps {
  ns: NamespaceMap
  onAdd: (long: string, short: string) => void
}

function AddMapRow(props: AddRowProps): JSX.Element {
  const { ns, onAdd } = props

  const [shortValue, setShort] = useState('')
  const shortValid = useMemo(
    () => isShortValid(shortValue, ns),
    [shortValue, ns],
  )

  const [longValue, setLong] = useState('')
  const longValid = useMemo(() => isLongValid(longValue, ns), [longValue, ns])

  const handleSubmit = useCallback(
    (evt: SubmitEvent): void => {
      evt.preventDefault()

      if (!shortValid || !longValid) return

      onAdd(shortValue, longValue)
      setShort('')
      setLong('')
    },
    [shortValid, longValid, onAdd, shortValue, longValue],
  )

  const handleShortChange = useCallback(
    (event: Event & { currentTarget: HTMLInputElement }): void => {
      setShort(event.currentTarget.value)
    },
    [setShort],
  )

  const handleLongChange = useCallback(
    (event: Event & { currentTarget: HTMLInputElement }): void => {
      setLong(event.currentTarget.value)
    },
    [setLong],
  )

  const id = useId()
  return (
    <tr>
      <td>
        <input
          type='text'
          value={shortValue}
          class={classes(!shortValid && styles.invalid)}
          onInput={handleShortChange}
        />
      </td>
      <td>
        <input
          type='text'
          form={id}
          value={longValue}
          class={classes(styles.stretch, !longValid && styles.invalid)}
          onInput={handleLongChange}
        />
      </td>
      <td>
        <form id={id} onSubmit={handleSubmit}>
          <button disabled={!(longValid && shortValid)}>Add</button>
        </form>
      </td>
    </tr>
  )
}

function ControlsRow(props: {
  ns: NamespaceMap
  nsLoadError?: any
  onReset: () => void
  onLoad: (file: File) => void
}): JSX.Element {
  const { nsLoadError, onReset, onLoad } = props

  const handleSubmit = useCallback(
    (event: SubmitEvent): void => {
      event.preventDefault()
      onReset()
    },
    [onReset],
  )

  const handleNamespaceMapExport = useCallback(
    (event: Event): void => {
      const data = JSON.stringify(props.ns.toJSON(), null, 2)
      const blob = new Blob([data], { type: Type.JSON })
      download(blob, 'namespaces.json', 'json')
    },
    [props.ns],
  )

  const handleNamespaceMapImport = useCallback(
    (file: File): void => {
      onLoad(file)
    },
    [onLoad],
  )

  return (
    <tr>
      <td colspan={2}>
        <button onClick={handleNamespaceMapExport}>Export</button>
        <DropArea
          types={[Type.JSON]}
          onDropFile={handleNamespaceMapImport}
          compact
        >
          Import
        </DropArea>
        {typeof nsLoadError !== 'undefined' && (
          <ErrorDisplay error={nsLoadError} />
        )}
      </td>
      <td>
        <form onSubmit={handleSubmit}>
          <button>Reset To Default</button>
        </form>
      </td>
    </tr>
  )
}

interface MapViewProps {
  ns: NamespaceMap
  long: string
  short: string
  onUpdate: (
    myShort: string,
    newShort: string | undefined,
    newLong: string | undefined,
  ) => void
  onDelete: (myShort: string) => void
}

function MapViewRow(props: MapViewProps): JSX.Element {
  const { short, long, ns, onUpdate, onDelete } = props

  const [shortValue, setShort] = useState(short)
  const shortValid = useMemo(
    () => isShortValid(shortValue, ns, short),
    [ns, short, shortValue],
  )

  const [longValue, setLong] = useState(long)
  const longValid = useMemo(
    () => isLongValid(longValue, ns, long),
    [long, longValue, ns],
  )

  const handleApply = useCallback(
    (evt: Event): void => {
      evt.preventDefault()

      const newShort = short !== shortValue ? shortValue : undefined
      const newLong = long !== longValue ? longValue : undefined

      // ensure that something has changed
      if (typeof newShort === 'undefined' && typeof newLong === 'undefined') {
        return
      }

      // ensure that both elements are valid
      if (!shortValid || !longValid) return

      onUpdate(short, newShort, newLong)
    },
    [long, longValid, longValue, onUpdate, short, shortValid, shortValue],
  )

  const handleEditShort = useCallback(
    (event: Event & { currentTarget: HTMLInputElement }): void => {
      setShort(event.currentTarget.value)
    },
    [],
  )

  const handleEditLong = useCallback(
    (event: Event & { currentTarget: HTMLInputElement }): void => {
      setLong(event.currentTarget.value)
    },
    [],
  )

  const handleDelete = useCallback(
    (event: Event): void => {
      event.preventDefault()

      onDelete(short)
    },
    [onDelete, short],
  )

  const valid = longValid && shortValid
  const dirty = longValue !== long || shortValue !== short
  const enabled = valid && dirty

  return (
    <tr>
      <td>
        <form onSubmit={handleApply}>
          <input
            type='text'
            value={shortValue}
            onInput={handleEditShort}
            class={classes(!shortValid && styles.invalid)}
          />
        </form>
      </td>
      <td>
        <form onSubmit={handleApply}>
          <input
            type='text'
            value={longValue}
            onInput={handleEditLong}
            class={classes(styles.stretch, !longValid && styles.invalid)}
          />
        </form>
      </td>
      <td>
        <button onClick={handleApply} disabled={!enabled}>
          Apply
        </button>
        &nbsp;
        <button onClick={handleDelete}>Delete</button>
      </td>
    </tr>
  )
}

function isShortValid(
  short: string,
  ns: NamespaceMap,
  oldShort?: string,
): boolean {
  if (!NamespaceMap.validKey.test(short)) {
    return false
  }
  if (typeof oldShort === 'string' && short === oldShort) {
    return true
  }
  return !ns.has(short)
}

function isLongValid(
  long: string,
  ns: NamespaceMap,
  oldLong?: string,
): boolean {
  return long !== ''
}
