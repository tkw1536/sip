import { Component, type ComponentChild } from 'preact'
import { resetRDFInterface } from './state/reducers/init'
import { type RReducerProps, type RState } from './state'
import { setActiveTab } from './state/reducers/tab'
import Tabs, { Label, Tab } from '../../components/tabs'
import StateManager from '../../lib/state_management'
import { LazyLoaded } from '../../components/spinner'

const RDFTab = LazyLoaded(async () => (await import('./tabs/rdf')).default)
const MapTab = LazyLoaded(async () => (await import('./tabs/map')).default)
const GraphTab = LazyLoaded(async () => (await import('./tabs/graph')).default)
const DocsTab = LazyLoaded(async () => (await import('./tabs/docs')).default)
const AboutTab = LazyLoaded(async () => (await import('./tabs/about')).default)

export class App extends Component<Record<never, never>, RState> {
  state: RState = resetRDFInterface()

  readonly #manager = new StateManager<RState>(this.setState.bind(this))

  componentWillUnmount(): void {
    this.#manager.cancel()
  }

  render(): ComponentChild {
    return <RDFViewer {...this.#manager.props(this.state)} />
  }
}

class RDFViewer extends Component<RReducerProps> {
  readonly #handleChangeTab = (key: string): void => {
    this.props.apply(setActiveTab(key))
  }

  render(): ComponentChild {
    const { apply, state } = this.props
    const props: RReducerProps = { apply, state }
    const loaded = state.loadStage === true

    return (
      <Tabs onChangeTab={this.#handleChangeTab} active={state.activeTab}>
        <Label>
          <b>RDF Viewer</b>
        </Label>

        <Tab title='RDF File' id=''>
          <RDFTab {...props} />
        </Tab>
        <Tab title='Graph' disabled={!loaded} id='graph'>
          <GraphTab {...props} />
        </Tab>
        <Tab title='Namespace Map &#9881;&#65039;' disabled={!loaded} id='ns'>
          <MapTab {...props} />
        </Tab>
        <Tab title='Docs' id='docs'>
          <DocsTab />
        </Tab>
        <Tab title='About' id='about'>
          <AboutTab />
        </Tab>
      </Tabs>
    )
  }
}
