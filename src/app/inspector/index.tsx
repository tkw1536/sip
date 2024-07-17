import { Component, type ComponentChild } from 'preact'
import { resetInspector } from './state/reducers'
import { type IReducerProps, type IState } from './state'
import { setActiveTab } from './state/reducers/tab'
import Tabs, { Label, Tab } from '../../components/tabs'

import DebugTab from './tabs/debug'
import { LazyLoaded } from '../../components/spinner'
import StateManager from '../../lib/state_management'

const PathbuilderTab = LazyLoaded(
  async () => (await import('./tabs/pathbuilder')).default,
)
const TreeTab = LazyLoaded(async () => (await import('./tabs/tree')).default)
const BundleGraphTab = LazyLoaded(
  async () => (await import('./tabs/bundle')).default,
)
const ModelGraphTab = LazyLoaded(
  async () => (await import('./tabs/model')).default,
)
const MapTab = LazyLoaded(async () => (await import('./tabs/map')).default)
const AboutTab = LazyLoaded(async () => (await import('./tabs/about')).default)

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
          <PathbuilderTab {...props} />
        </Tab>
        <Tab title='Tree' disabled={!loaded} id='tree'>
          <TreeTab {...props} />
        </Tab>
        <Tab title='Bundle Graph' disabled={!loaded} id='bundle'>
          <BundleGraphTab {...props} />
        </Tab>
        <Tab title='Model Graph' disabled={!loaded} id='model'>
          <ModelGraphTab {...props} />
        </Tab>
        <Tab title='Namespace Map &#9881;&#65039;' disabled={!loaded} id='ns'>
          <MapTab {...props} />
        </Tab>
        <Tab title='About' id='about'>
          <AboutTab />
        </Tab>
        {import.meta.env.DEV && (
          <Tab title='Debug' id='debug'>
            <DebugTab {...props} />
          </Tab>
        )}
      </Tabs>
    )
  }
}
