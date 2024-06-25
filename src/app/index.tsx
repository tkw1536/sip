import { Component, ComponentChild } from 'preact'
import * as styles from './index.module.css'
import { classes } from '../lib/utils/classes'
import { resetInterface } from './state/reducers/init'
import { Reducer, ReducerProps, State } from './state'
import { Operation } from '../lib/utils/operation'
import ExportView from './views/inspector/export'
import HierarchyView from './views/inspector/hierarchy'
import BundleGraphView from './views/inspector/graph/bundle'
import MapView from './views/inspector/map'
import ModelGraphView from './views/inspector/graph/model'
import GraphConfigView from './views/inspector/config'
import Tabs, { Label, Tab } from '../lib/components/tabs'
import DocsView from './views/docs'
import { setActiveTab } from './state/reducers/inspector/tab'
import PathbuilderView from './views/pathbuilder'

class Wrapper extends Component {
  render (): ComponentChild {
    const { children } = this.props
    return (
      <>
        <main class={classes(styles.main)}>
          {children}
        </main>
        <footer class={classes(styles.footer)}>
          &copy; Tom Wiesing 2024. All rights reserved.
        </footer>
      </>
    )
  }
}

export class App extends Component<{}, State> {
  state: State = resetInterface()

  private readonly reduction = new Operation()

  private readonly applyReducer = (reducer: Reducer): void => {
    const ticket = this.reduction.ticket()

    this.setState(state => {
      if (!ticket()) return null

      // if we got an actual value, apply it now!
      const reduced = reducer(state)
      if (!(reduced instanceof Promise)) {
        return reduced
      }

      reduced
        .then(res => {
          // ensure that we have some valid state to apply
          if (!ticket() || res === null) return

          // apply the state
          this.setState(() => ticket() ? res : null)
        })
        .catch(err => {
          console.error('Error applying reducer')
          console.error(err)
        })

      return null // nothing to do for now (only when the promise resolves)
    })
  }

  componentWillUnmount (): void {
    this.reduction.cancel()
  }

  render (): ComponentChild {
    const props: ReducerProps = { state: this.state, apply: this.applyReducer }
    return (
      <Wrapper>
        <Inspector {...props} />
      </Wrapper>
    )
  }
}

class Inspector extends Component<ReducerProps> {
  private readonly handleActiveTab = (index: number): void => {
    this.props.apply(setActiveTab(index))
  }

  render (): ComponentChild {
    const { apply, state } = this.props
    const props: ReducerProps = { apply, state }
    const loaded = state.loaded === true
    return (
      <Tabs onChangeTab={this.handleActiveTab} activeIndex={state.activeTabIndex}>
        <Label><b>Supreme Inspector for Pathbuilders</b></Label>

        <Tab title='Pathbuilder'>
          <PathbuilderView {...props} />
        </Tab>
        <Tab title='Hierarchy' disabled={!loaded}>
          <HierarchyView {...props} />
        </Tab>
        <Tab title='Bundle Graph' disabled={!loaded}>
          <BundleGraphView {...props} />
        </Tab>
        <Tab title='Model Graph' disabled={!loaded}>
          <ModelGraphView {...props} />
        </Tab>
        <Tab title='Namespace Map &#9881;&#65039;' disabled={!loaded}>
          <MapView {...props} />
        </Tab>
        <Tab title='Graph Backends &#9881;&#65039;' disabled={!loaded}>
          <GraphConfigView {...props} />
        </Tab>
        <Tab title='Export' disabled={!loaded}>
          <ExportView {...props} />
        </Tab>
        <Tab title='Docs'>
          <DocsView />
        </Tab>
      </Tabs>
    )
  }
}
