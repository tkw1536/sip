import { Component, type ComponentChild } from 'preact'
import * as styles from './index.module.css'
import { classes } from '../lib/utils/classes'
import { resetInterface } from './state/reducers/init'
import { type Reducer, type ReducerProps, type State } from './state'
import { Operation } from '../lib/utils/operation'
import HierarchyView from './views/inspector/hierarchy'
import BundleGraphView from './views/inspector/graph/bundle'
import MapView from './views/inspector/map'
import ModelGraphView from './views/inspector/graph/model'
import Tabs, { Label, Tab } from '../lib/components/tabs'
import DocsView from './views/docs'
import { setActiveTab } from './state/reducers/inspector/tab'
import PathbuilderView from './views/pathbuilder'
import AboutView from './views/about'
import { Narrow, Wide } from './containers'
import DebugView from './views/debug'

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

export class App extends Component<Record<never, never>, State> {
  state: State = resetInterface()

  private readonly reduction = new Operation()

  private readonly apply = (reducers: Reducer | Reducer[], callback?: (error?: unknown) => void): void => {
    const ticket = this.reduction.ticket()

    this.applyReducers(ticket, Array.isArray(reducers) ? reducers : [reducers])
      .then(() => {
        if (typeof callback === 'function') callback()
      })
      .catch(err => {
        if (typeof callback === 'function') callback(err)
      })
  }

  private readonly applyReducers = async (ticket: () => boolean, reducers: Reducer[]): Promise<void> => {
    for (const reducer of reducers) {
      await this.applyReducer(ticket, reducer)
    }
  }

  private readonly applyReducer = async (ticket: () => boolean, reducer: Reducer): Promise<void> => {
    await new Promise<void>(resolve => {
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
            this.setState(() => ticket() ? res : null, resolve)
          })
          .catch(err => {
            console.error('Error applying reducer')
            console.error(err)
          })

        reducerReturnedPromise = true
        return null // nothing to do for now (only when the promise resolves)
      },
      () => { if (!reducerReturnedPromise) { resolve() } }
      )
    })
  }

  componentWillUnmount (): void {
    this.reduction.cancel()
  }

  render (): ComponentChild {
    const props: ReducerProps = { state: this.state, apply: this.apply }
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
    const loaded = state.loadStage === true

    return (
      <Tabs onChangeTab={this.handleChangeTab} active={state.activeTab}>
        <Label><b>Supreme Inspector for Pathbuilders</b></Label>

        <Tab title='Pathbuilder' id=''>
          <Narrow><PathbuilderView {...props} /></Narrow>
        </Tab>
        <Tab title='Hierarchy' disabled={!loaded} id='hierarchy'>
          <Wide><HierarchyView {...props} /></Wide>
        </Tab>
        <Tab title='Bundle Graph' disabled={!loaded} id='bundle'>
          <Wide fillParent><BundleGraphView {...props} /></Wide>
        </Tab>
        <Tab title='Model Graph' disabled={!loaded} id='model'>
          <Wide fillParent><ModelGraphView {...props} /></Wide>
        </Tab>
        <Tab title='Namespace Map &#9881;&#65039;' disabled={!loaded} id='ns'>
          <Narrow><MapView {...props} /></Narrow>
        </Tab>
        <Tab title='Docs' id='docs'>
          <Narrow><DocsView /></Narrow>
        </Tab>
        <Tab title='About' id='about'>
          <Narrow><AboutView /></Narrow>
        </Tab>
        {process.env.NODE_ENV !== 'production' && (
          <Tab title='Debug' id='debug'>
            <Narrow><DebugView {...props} /></Narrow>
          </Tab>
        )}
      </Tabs>
    )
  }
}
