import { Component, ComponentChild } from 'preact'

import ExportView from './views/export'
import ListView from './views/list'
import BundleGraphView from './views/graph/bundle'
import MapView from './views/map'
import ModelGraphView from './views/graph/model'
import GraphConfigView from './views/config'
import Tabs, { Label, Tab } from '../lib/components/tabs'
import DocsView from './docs'
import { ReducerProps } from './state'
import { setActiveTab } from './state/reducers/inspector/tab'
import { resetInterface } from './state/reducers/init'

export class Viewer extends Component<ReducerProps> {
  private readonly handleActiveTab = (index: number): void => {
    this.props.apply(setActiveTab(index))
  }

  private readonly handleClose = (evt: Event): void => {
    evt.preventDefault()
    this.props.apply(resetInterface)
  }

  render (): ComponentChild {
    const { apply, state } = this.props
    const props: ReducerProps = { apply, state }
    return (
      <Tabs onChangeTab={this.handleActiveTab} activeIndex={state.activeTabIndex}>
        <Label><b>Supreme Inspector for Pathbuilders</b></Label>
        <Tab title='Overview'>
          <ListView {...props} />
        </Tab>
        <Tab title='Bundle Graph'>
          <BundleGraphView {...props} />
        </Tab>
        <Tab title='Model Graph'>
          <ModelGraphView {...props} />
        </Tab>
        <Tab title='Namespace Map &#9881;&#65039;'>
          <MapView {...props} />
        </Tab>
        <Tab title='Graph Backends &#9881;&#65039;'>
          <GraphConfigView {...props} />
        </Tab>
        <Tab title='Export'>
          <ExportView {...props} />
        </Tab>
        <Tab title='Close'>
          <p>
            To close this pathbuilder click the following button.
            You can also just close this tab.
          </p>
          <p>
            <button onClick={this.handleClose}>Close</button>
          </p>
        </Tab>
        <Tab title='Docs'>
          <DocsView />
        </Tab>
      </Tabs>
    )
  }
}
