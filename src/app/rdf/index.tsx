import { Component, type ComponentChild } from 'preact'
import { resetRDFInterface } from './state/reducers/init'
import { type RReducerProps, type RState } from './state'
import { setActiveTab } from './state/reducers/tab'
import Tabs, { Label, Tab } from '../../lib/components/tabs'

import StateManager from '../../lib/state_management'
import RDFTab from './tabs/rdf'
import MapTab from './tabs/map'
import GraphTab from './tabs/graph'

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
      </Tabs>
    )
  }
}
