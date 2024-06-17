import { h, Component, Fragment, ComponentChild } from 'preact'
import type { ViewProps } from '../viewer'
import styles from './map.module.css'
import { WithID } from '../../lib/wrapper'

export default class MapView extends Component<ViewProps> {
  render (): ComponentChild {
    const { namespaceVersion: newNSKey, ns } = this.props
    const mp = ns.toMap()

    return (
      <Fragment>
        <p>
          The Namespace Map is used to shorten URIs for display within the inspector.
          The underlying pathbuilder always contains the full URIs, and namespaces are not saved across reloads.
          <br />
          The initial version is generated automatically from all URIs found in the pathbuilder.
          You can manually adjust it here, by adding, removing or editing abbreviations.
        </p>
        <table className={styles.table}>
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
      </Fragment>
    )
  }
}

const AddMapRow = WithID<ViewProps>(class AddMapRow extends Component<ViewProps & { id: string }> {
  state = { short: '', long: '' }

  private readonly handleSubmit = (evt: SubmitEvent): void => {
    evt.preventDefault()

    const { short, long } = this.state
    const { addNS } = this.props
    addNS(long, short)
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
          <input type='text' value={short} onChange={this.handleShortChange} />
        </td>
        <td>
          <input type='text' className={styles.wide} form={id} value={long} onChange={this.handleLongChange} />
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

class ResetNSRow extends Component<ViewProps> {
  private readonly handleSubmit = (evt: SubmitEvent): void => {
    evt.preventDefault()
    this.props.resetNS()
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

class MapViewRow extends Component<{ long: string, short: string, props: ViewProps }, { value?: string }> {
  state: { value?: string } = {}

  private readonly handleSubmit = (evt: Event): void => {
    evt.preventDefault()

    const { value } = this.state
    if (typeof value !== 'string') return // do nothing

    const { long, props: { updateNS } } = this.props
    updateNS(long, value)
  }

  private readonly handleChange = (event: Event & { currentTarget: HTMLInputElement }): void => {
    this.setState({ value: event.currentTarget.value })
  }

  private readonly handleDelete = (event: Event): void => {
    event.preventDefault()

    this.props.props.deleteNS(this.props.long)
  }

  render (): ComponentChild {
    const { long, short } = this.props
    const value = this.state.value ?? short
    const dirty = value !== short
    return (
      <tr>
        <td>
          <form onSubmit={this.handleSubmit}>
            <input type='text' value={value ?? short} onChange={this.handleChange} />
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
