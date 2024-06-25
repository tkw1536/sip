import { Component, ComponentChild } from 'preact'
import * as styles from './map.module.css'
import { WithID } from '../../lib/components/wrapper'
import { ReducerProps } from '../state'
import { addNamespace, deleteNamespace, resetNamespaceMap, updateNamespace } from '../state/reducers/inspector/ns'

export default class MapView extends Component<ReducerProps> {
  render (): ComponentChild {
    const { namespaceVersion: newNSKey, ns } = this.props.state
    const mp = ns.toMap()

    return (
      <>
        <p>
          The Namespace Map is used to shorten URIs for display within the inspector.
          The underlying pathbuilder always contains the full URIs, and namespaces are not saved across reloads.
          <br />
          The initial version is generated automatically from all URIs found in the pathbuilder.
          You can manually adjust it here, by adding, removing or editing abbreviations.
        </p>
        <table>
          <thead>
            <tr>
              <th>
                NS
              </th>
              <th>
                URI
              </th>
              <th />
            </tr>
          </thead>
          <tbody>
            {Array.from(mp.entries()).map(([long, short]) =>
              <MapViewRow props={this.props} long={long} short={short} key={short} />
            )}
            <AddMapRow key={newNSKey} {...this.props} />
            <ResetNSRow {...this.props} />
          </tbody>
        </table>
      </>
    )
  }
}

const AddMapRow = WithID<ReducerProps>(class AddMapRow extends Component<ReducerProps & { id: string }> {
  state = { short: '', long: '' }

  private readonly handleSubmit = (evt: SubmitEvent): void => {
    evt.preventDefault()

    const { short, long } = this.state
    this.props.apply(addNamespace(long, short))
  }

  private readonly handleShortChange = (event: Event & { currentTarget: HTMLInputElement }): void => {
    this.setState({ short: event.currentTarget.value })
  }

  private readonly handleLongChange = (event: Event & { currentTarget: HTMLInputElement }): void => {
    this.setState({ long: event.currentTarget.value })
  }

  render (): ComponentChild {
    const { id } = this.props
    const { short, long } = this.state

    return (
      <tr>
        <td>
          <input type='text' value={short} onInput={this.handleShortChange} />
        </td>
        <td>
          <input type='text' class={styles.wide} form={id} value={long} onInput={this.handleLongChange} />
        </td>
        <td>
          <form id={id} onSubmit={this.handleSubmit}>
            <button>Add</button>
          </form>
        </td>
      </tr>
    )
  }
})

class ResetNSRow extends Component<ReducerProps> {
  private readonly handleSubmit = (evt: SubmitEvent): void => {
    evt.preventDefault()
    this.props.apply(resetNamespaceMap())
  }

  render (): ComponentChild {
    return (
      <tr>
        <td />
        <td />
        <td>
          <form onSubmit={this.handleSubmit}>
            <button>Reset To Default</button>
          </form>
        </td>
      </tr>
    )
  }
}

class MapViewRow extends Component<{ long: string, short: string, props: ReducerProps }, { value?: string }> {
  state: { value?: string } = {}

  private readonly handleSubmit = (evt: Event): void => {
    evt.preventDefault()

    const { value } = this.state
    if (typeof value !== 'string') return // do nothing

    const { long } = this.props
    this.props.props.apply(updateNamespace(long, value))
  }

  private readonly handleChange = (event: Event & { currentTarget: HTMLInputElement }): void => {
    this.setState({ value: event.currentTarget.value })
  }

  private readonly handleDelete = (event: Event): void => {
    event.preventDefault()

    this.props.props.apply(deleteNamespace(this.props.long))
  }

  render (): ComponentChild {
    const { long, short } = this.props
    const value = this.state.value ?? short
    const dirty = value !== short
    return (
      <tr>
        <td>
          <form onSubmit={this.handleSubmit}>
            <input type='text' value={value ?? short} onInput={this.handleChange} />
          </form>
        </td>
        <td>
          <code>{long}</code>
        </td>
        <td>
          <button onClick={this.handleSubmit} disabled={!dirty}>
            Apply
          </button>
          &nbsp;
          <button onClick={this.handleDelete}>
            Delete
          </button>
        </td>
      </tr>
    )
  }
}
