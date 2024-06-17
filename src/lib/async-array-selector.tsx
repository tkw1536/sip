import { h, Component, ComponentChild } from 'preact'

interface AsyncArraySelectorProps {
  load: () => Promise<string[]>
  value?: string
  onChange: (value: string) => void
}

interface AsyncArraySelectorState {
  values?: string[]
}
export default class AsyncArraySelector extends Component<AsyncArraySelectorProps> {
  state: AsyncArraySelectorState = {}

  private mounted = false
  componentDidMount (): void {
    this.mounted = true
    this.loadOptions()
  }

  componentWillUnmount (): void {
    this.mounted = false
  }

  componentDidUpdate (previousProps: Readonly<AsyncArraySelectorProps>, previousState: Readonly<{}>, snapshot: any): void {
    if (previousProps.load !== this.props.load) {
      this.loadOptions()
    }
  }

  private lastLoadId = 0
  private readonly loadOptions = (): void => {
    const loadId = ++this.lastLoadId

    this.props.load().then(values =>
      this.setState(() => {
        if (!this.mounted) return null
        if (this.lastLoadId !== loadId) return null
        return { values }
      })
    ).catch(e => {
      console.warn('failed to load: ', e)
    })
  }

  private readonly handleChange = (evt: Event & { currentTarget: HTMLSelectElement }): void => {
    evt.preventDefault()
    this.props.onChange(evt.currentTarget.value)
  }

  render (): ComponentChild {
    const { value } = this.props
    const { values } = this.state
    if ((values == null) || typeof value !== 'string') {
      return <select />
    }
    return (
      <select value={this.props.value} onChange={this.handleChange}>
        {
                    values.map(value => <option key={value}>{value}</option>)
                }
      </select>
    )
  }
}
