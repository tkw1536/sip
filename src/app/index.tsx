import { Component, ComponentChild } from 'preact'
import * as styles from './index.module.css'
import { classes } from '../lib/utils/classes'
import { resetInterface } from './state/reducers/init'
import { Reducer, ReducerProps, State } from './state'
import { Operation } from '../lib/utils/operation'
import HierarchyView from './views/inspector/hierarchy'
import BundleGraphView from './views/inspector/graph/bundle'
import MapView from './views/inspector/map'
import ModelGraphView from './views/inspector/graph/model'
import GraphConfigView from './views/inspector/config'
import Tabs, { Label, Tab } from '../lib/components/tabs'
import DocsView from './views/docs'
import { setActiveTab } from './state/reducers/inspector/tab'
import PathbuilderView from './views/pathbuilder'
import AboutView from './views/about'

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

  private readonly applyReducer = (reducer: Reducer, callback?: () => void): void => {
    const ticket = this.reduction.ticket()

    let reducerReturnedPromise = false
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
          if (!ticket()) return

          // apply the state
          this.setState(() => ticket() ? res : null, callback)
        })
        .catch(err => {
          console.error('Error applying reducer')
          console.error(err)
        })

      reducerReturnedPromise = true
      return null // nothing to do for now (only when the promise resolves)
    },
    (typeof callback === 'function') ? () => { if (!reducerReturnedPromise) { callback() } } : undefined
    )
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
  private readonly handleChangeTab = (key: string): void => {
    this.props.apply(setActiveTab(key))
  }

  render (): ComponentChild {
    const { apply, state } = this.props
    const props: ReducerProps = { apply, state }
    const loaded = state.loaded === true
    return (
      <Tabs onChangeTab={this.handleChangeTab} active={state.activeTab}>
        <Label><b>Supreme Inspector for Pathbuilders</b></Label>

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
        <Tab title='Graph Backends &#9881;&#65039;' disabled={!loaded} id='config'>
          <GraphConfigView {...props} />
        </Tab>
        <Tab title='Docs' id='docs'>
          <DocsView />
        </Tab>
        <Tab title='About' id='about'>
          <AboutView />
        </Tab>
      </Tabs>
    )
  }
}
