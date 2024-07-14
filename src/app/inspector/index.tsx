import { Component, type ComponentChild } from 'preact'
import { resetInspector } from './state/reducers/init'
import { type IReducerProps, type IState } from './state'
import { setActiveTab } from './state/reducers/inspector/tab'
import Tabs, { Label, Tab } from '../../lib/components/tabs'

import DebugView from './views/debug'
import { LazyLoaded } from '../../lib/components/loader/loader'
import StateManager from '../../lib/state_management'

const PathbuilderView = LazyLoaded(
  async () => (await import('./views/pathbuilder')).default,
)
const HierarchyView = LazyLoaded(
  async () => (await import('./views/inspector/hierarchy')).default,
)
const BundleGraphView = LazyLoaded(
  async () => (await import('./views/inspector/graph/bundle')).default,
)
const ModelGraphView = LazyLoaded(
  async () => (await import('./views/inspector/graph/model')).default,
)
const MapView = LazyLoaded(
  async () => (await import('./views/inspector/map')).default,
)
const DocsView = LazyLoaded(async () => (await import('./views/docs')).default)
const AboutView = LazyLoaded(
  async () => (await import('./views/about')).default,
)

export class App extends Component<Record<never, never>, IState> {
  state: IState = resetInspector()

  readonly #manager = new StateManager<IState>(this.setState.bind(this))

  componentWillUnmount(): void {
    this.#manager.cancel()
  }

  render(): ComponentChild {
    return <Inspector {...this.#manager.props(this.state)} />
  }
}

class Inspector extends Component<IReducerProps> {
  readonly #handleChangeTab = (key: string): void => {
    this.props.apply(setActiveTab(key))
  }

  render(): ComponentChild {
    const { apply, state } = this.props
    const props: IReducerProps = { apply, state }
    const loaded = state.loadStage === true

    return (
      <Tabs onChangeTab={this.#handleChangeTab} active={state.activeTab}>
        <Label>
          <b>Supreme Inspector for Pathbuilders</b>
        </Label>

        <Tab title='Pathbuilder' id=''>
          <PathbuilderView {...props} />
        </Tab>
        <Tab title='Hierarchy' disabled={!loaded} id='hierarchy'>
          <HierarchyView {...props} />
        </Tab>
        <Tab title='Bundle Graph' disabled={!loaded} id='bundle'>
          <BundleGraphView {...props} />
        </Tab>
        <Tab title='Model Graph' disabled={!loaded} id='model'>
          <ModelGraphView {...props} />
        </Tab>
        <Tab title='Namespace Map &#9881;&#65039;' disabled={!loaded} id='ns'>
          <MapView {...props} />
        </Tab>
        <Tab title='Docs' id='docs'>
          <DocsView />
        </Tab>
        <Tab title='About' id='about'>
          <AboutView />
        </Tab>
        {import.meta.env.DEV && (
          <Tab title='Debug' id='debug'>
            <DebugView {...props} />
          </Tab>
        )}
      </Tabs>
    )
  }
}
