import { Component, type JSX, type ComponentChild } from 'preact'
import { NamespaceMap } from '../lib/pathbuilder/namespace'
import { Type } from '../lib/utils/media'
import download from '../lib/utils/download'
import DropArea from './drop-area'
import ErrorDisplay from './error'
import * as styles from './namespace-editor.module.css'
import { Operation } from '../lib/utils/operation'
import { classes } from '../lib/utils/classes'
import { useCallback, useId, useMemo, useState } from 'preact/hooks'

interface NamespaceEditorProps {
  ns: NamespaceMap
  nsKey: string | number
  onReset: () => void
  onUpdate: (ns: NamespaceMap) => void
}

interface NamespaceEditorState {
  loadError?: any
}

export default class NamespaceEditor extends Component<
  NamespaceEditorProps,
  NamespaceEditorState
> {
  state: NamespaceEditorState = {}

  readonly #handleUpdate = (
    short: string,
    newShort: string | undefined,
    newLong: string | undefined,
  ): void => {
    this.setState({ loadError: undefined }, () => {
      let { ns } = this.props
      if (typeof newLong === 'string') {
        ns = ns.update(short, newLong)
      }
      if (typeof newShort === 'string') {
        ns = ns.rename(short, newShort)
      }

      this.props.onUpdate(ns)
    })
  }
  readonly #handleAdd = (short: string, long: string): void => {
    this.setState({ loadError: undefined }, () => {
      this.props.onUpdate(this.props.ns.add(short, long))
    })
  }
  readonly #handleDelete = (long: string): void => {
    this.setState({ loadError: undefined }, () => {
      this.props.onUpdate(this.props.ns.remove(long))
    })
  }

  readonly #operation = new Operation()
  readonly #loadNS = (file: File): void => {
    void this.#doLoadNS(file)
  }
  readonly #doLoadNS = async (file: File): Promise<void> => {
    const ticket = this.#operation.ticket()

    let ns: NamespaceMap
    try {
      const data = JSON.parse(await file.text())
      const newNS = NamespaceMap.fromJSON(data)
      if (newNS === null) throw new Error('not a valid namespace map')
      ns = newNS
    } catch (e: unknown) {
      if (!ticket()) return
      this.setState({ loadError: e })
      return
    }

    if (!ticket()) return
    this.props.onUpdate(ns)
  }

  componentWillUnmount(): void {
    this.#operation.cancel()
  }

  render(): ComponentChild {
    const { nsKey, ns, onReset } = this.props
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
              onUpdate={this.#handleUpdate.bind(this, short)}
              onDelete={this.#handleDelete.bind(this, short)}
            />
          ))}
          <AddMapRow ns={ns} key={nsKey} onAdd={this.#handleAdd} />
          <ControlsRow
            ns={ns}
            nsLoadError={this.state.loadError}
            onReset={onReset}
            onLoad={this.#loadNS}
          />
        </tbody>
      </table>
    )
  }
}

interface AddRowProps {
  ns: NamespaceMap
  onAdd: (long: string, short: string) => void
}

function AddMapRow(props: AddRowProps): JSX.Element {
  const [short, setShort] = useState('')
  const shortValid = useMemo(
    () => isShortValid(short, props.ns),
    [short, props.ns],
  )

  const [long, setLong] = useState('')
  const longValid = useMemo(() => isLongValid(long, props.ns), [long, props.ns])

  const handleSubmit = useCallback(
    (evt: SubmitEvent): void => {
      evt.preventDefault()

      if (!shortValid || !longValid) return
      props.onAdd(short, long)
    },
    [shortValid, longValid, props, short, long],
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
          value={short}
          class={classes(!shortValid && styles.invalid)}
          onInput={handleShortChange}
        />
      </td>
      <td>
        <input
          type='text'
          form={id}
          value={long}
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
  onUpdate: (newShort: string | undefined, newLong: string | undefined) => void
  onDelete: () => void
}

interface MapViewState {
  short?: string
  shortValid: boolean
  long?: string
  longValid: boolean
}

class MapViewRow extends Component<MapViewProps, MapViewState> {
  state: MapViewState = { shortValid: true, longValid: true }

  readonly #handleApply = (evt: Event): void => {
    evt.preventDefault()

    const { short, long } = this.props
    const { long: longValue = long, short: shortValue = short } = this.state

    const newShort = short !== shortValue ? shortValue : undefined
    const newLong = long !== longValue ? longValue : undefined

    // ensure that something has changed
    if (typeof newShort === 'undefined' && typeof newLong === 'undefined') {
      return
    }

    // ensure that both elements are valid
    const { shortValid, longValid } = this.state
    if (!shortValid || !longValid) return

    this.props.onUpdate(newShort, newLong)
  }

  readonly #handleEditShort = (
    event: Event & { currentTarget: HTMLInputElement },
  ): void => {
    const { value: short } = event.currentTarget
    const { short: oldShort, ns } = this.props
    this.setState({ short, shortValid: isShortValid(short, ns, oldShort) })
  }
  readonly #handleEditLong = (
    event: Event & { currentTarget: HTMLInputElement },
  ): void => {
    const { value: long } = event.currentTarget
    const { long: oldLong, ns } = this.props
    this.setState({ long, longValid: isLongValid(long, ns, oldLong) })
  }

  readonly #handleDelete = (event: Event): void => {
    event.preventDefault()

    this.props.onDelete()
  }

  render(): ComponentChild {
    const { long, short } = this.props
    const {
      long: longValue = long,
      longValid,
      short: shortValue = short,
      shortValid,
    } = this.state

    const valid = longValid && shortValid
    const dirty = longValue !== long || shortValue !== short
    const enabled = valid && dirty

    return (
      <tr>
        <td>
          <form onSubmit={this.#handleApply}>
            <input
              type='text'
              value={shortValue}
              onInput={this.#handleEditShort}
              class={classes(!shortValid && styles.invalid)}
            />
          </form>
        </td>
        <td>
          <form onSubmit={this.#handleApply}>
            <input
              type='text'
              value={longValue}
              onInput={this.#handleEditLong}
              class={classes(styles.stretch, !longValid && styles.invalid)}
            />
          </form>
        </td>
        <td>
          <button onClick={this.#handleApply} disabled={!enabled}>
            Apply
          </button>
          &nbsp;
          <button onClick={this.#handleDelete}>Delete</button>
        </td>
      </tr>
    )
  }
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
