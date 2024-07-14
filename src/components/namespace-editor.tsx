import { Component, type ComponentChild } from 'preact'
import { NamespaceMap } from '../lib/pathbuilder/namespace'
import { WithID } from './wrapper'
import { Type } from '../lib/utils/media'
import download from '../lib/utils/download'
import DropArea from './drop-area'
import ErrorDisplay from './error'
import * as styles from './namespace-editor.module.css'
import { Operation } from '../lib/utils/operation'
import { classes } from '../lib/utils/classes'

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

  readonly #handleSet = (short: string, long: string): void => {
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
      <table>
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
              long={long}
              short={short}
              key={short}
              onUpdate={this.#handleSet.bind(this, short)}
              onDelete={this.#handleDelete.bind(this, short)}
            />
          ))}
          <AddMapRow key={nsKey} onAdd={this.#handleSet} />
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
  onAdd: (long: string, short: string) => void
}

const AddMapRow = WithID<AddRowProps>(
  class AddMapRow extends Component<AddRowProps & { id: string }> {
    state = { short: '', shortValid: false, long: '', longValid: false }

    readonly #handleSubmit = (evt: SubmitEvent): void => {
      evt.preventDefault()

      const { short, long } = this.state
      this.props.onAdd(short, long)
    }

    readonly #handleShortChange = (
      event: Event & { currentTarget: HTMLInputElement },
    ): void => {
      const { value: short } = event.currentTarget
      const shortValid = NamespaceMap.validKey.test(short)
      this.setState({ short, shortValid })
    }

    readonly #handleLongChange = (
      event: Event & { currentTarget: HTMLInputElement },
    ): void => {
      const { value: long } = event.currentTarget
      const longValid = long !== ''
      this.setState({ long, longValid })
    }

    render(): ComponentChild {
      const { id } = this.props
      const { short, shortValid, long, longValid } = this.state

      return (
        <tr>
          <td>
            <input
              type='text'
              value={short}
              class={classes(!shortValid && styles.invalid)}
              onInput={this.#handleShortChange}
            />
          </td>
          <td>
            <input
              type='text'
              form={id}
              value={long}
              class={classes(styles.wide, !longValid && styles.invalid)}
              onInput={this.#handleLongChange}
            />
          </td>
          <td>
            <form id={id} onSubmit={this.#handleSubmit}>
              <button>Add</button>
            </form>
          </td>
        </tr>
      )
    }
  },
)

class ControlsRow extends Component<{
  ns: NamespaceMap
  nsLoadError?: any
  onReset: () => void
  onLoad: (file: File) => void
}> {
  readonly #handleSubmit = (evt: SubmitEvent): void => {
    evt.preventDefault()
    this.props.onReset()
  }

  readonly #handleNamespaceMapExport = (evt: Event): void => {
    const data = JSON.stringify(this.props.ns.toJSON(), null, 2)
    const blob = new Blob([data], { type: Type.JSON })
    download(blob, 'namespaces.json', 'json')
  }

  readonly #handleNamespaceMapImport = (file: File): void => {
    this.props.onLoad(file)
  }

  render(): ComponentChild {
    const { nsLoadError } = this.props
    return (
      <tr>
        <td colspan={2}>
          <button onClick={this.#handleNamespaceMapExport}>Export</button>
          <DropArea
            types={[Type.JSON]}
            onDropFile={this.#handleNamespaceMapImport}
            compact
          >
            Import
          </DropArea>
          {typeof nsLoadError !== 'undefined' && (
            <ErrorDisplay error={nsLoadError} />
          )}
        </td>
        <td>
          <form onSubmit={this.#handleSubmit}>
            <button>Reset To Default</button>
          </form>
        </td>
      </tr>
    )
  }
}

class MapViewRow extends Component<
  {
    long: string
    short: string
    onUpdate: (newLong: string) => void
    onDelete: () => void
  },
  { value?: string }
> {
  state: { value?: string } = {}

  readonly #handleUpdate = (evt: Event): void => {
    evt.preventDefault()

    const { value } = this.state
    if (typeof value !== 'string') return // do nothing

    this.props.onUpdate(value)
  }

  readonly #handleEdit = (
    event: Event & { currentTarget: HTMLInputElement },
  ): void => {
    this.setState({ value: event.currentTarget.value })
  }

  readonly #handleDelete = (event: Event): void => {
    event.preventDefault()

    this.props.onDelete()
  }

  render(): ComponentChild {
    const { long, short } = this.props
    const value = this.state.value ?? long
    const dirty = value !== long
    return (
      <tr>
        <td>
          <code>{short}</code>
        </td>
        <td>
          <form onSubmit={this.#handleUpdate}>
            <input
              type='text'
              value={value}
              onInput={this.#handleEdit}
              class={styles.wide}
            />
          </form>
        </td>
        <td>
          <button onClick={this.#handleUpdate} disabled={!dirty}>
            Apply
          </button>
          &nbsp;
          <button onClick={this.#handleDelete}>Delete</button>
        </td>
      </tr>
    )
  }
}
