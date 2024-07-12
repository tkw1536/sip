import { Component, type ComponentChild } from 'preact'
import * as styles from './index.module.css'
import { classes } from '../lib/utils/classes'
import { resetInterface } from './state/reducers/init'
import { type Reducer, type ReducerProps, type State } from './state'
import { Operation } from '../lib/utils/operation'
import { setActiveTab } from './state/reducers/inspector/tab'
import Tabs, { Label, Tab } from '../lib/components/tabs'

import DebugView from './views/debug'
import RDFGraphView from './views/inspector/graph/rdf'
import { LazyLoaded } from './loader/loader'

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

class Wrapper extends Component {
  render(): ComponentChild {
    const { children } = this.props
    return (
      <>
        <main class={classes(styles.main)}>{children}</main>
        <footer class={classes(styles.footer)}>
          &copy; Tom Wiesing 2024. All rights reserved.
        </footer>
      </>
    )
  }
}

export class App extends Component<Record<never, never>, State> {
  state: State = resetInterface()

  readonly #reduction = new Operation()

  readonly #apply = (
    reducers: Reducer | Reducer[],
    callback?: (error?: unknown) => void,
  ): void => {
    const ticket = this.#reduction.ticket()

    this.#applyReducers(ticket, Array.isArray(reducers) ? reducers : [reducers])
      .then(() => {
        if (typeof callback === 'function') callback()
      })
      .catch(err => {
        if (typeof callback === 'function') callback(err)
      })
  }

  readonly #applyReducers = async (
    ticket: () => boolean,
    reducers: Reducer[],
  ): Promise<void> => {
    for (const reducer of reducers) {
      await this.#applyReducer(ticket, reducer)
    }
  }

  readonly #applyReducer = async (
    ticket: () => boolean,
    reducer: Reducer,
  ): Promise<void> => {
    await new Promise<void>(resolve => {
      let reducerReturnedPromise = false
      this.setState(
        state => {
          if (!ticket()) return null

          // if we got an actual value, apply it now!
          const reduced = reducer(state)
          if (!(reduced instanceof Promise)) {
            return reduced
          }

          reduced
            .then(res => {
              this.setState(() => (ticket() ? res : null), resolve)
            })
            .catch(err => {
              console.error('Error applying reducer')
              console.error(err)
            })

          reducerReturnedPromise = true
          return null // nothing to do for now (only when the promise resolves)
        },
        () => {
          if (!reducerReturnedPromise) {
            resolve()
          }
        },
      )
    })
  }

  componentWillUnmount(): void {
    this.#reduction.cancel()
  }

  render(): ComponentChild {
    const props: ReducerProps = { state: this.state, apply: this.#apply }
    return (
      <Wrapper>
        <Inspector {...props} />
      </Wrapper>
    )
  }
}

class Inspector extends Component<ReducerProps> {
  readonly #handleChangeTab = (key: string): void => {
    this.props.apply(setActiveTab(key))
  }

  render(): ComponentChild {
    const { apply, state } = this.props
    const props: ReducerProps = { apply, state }
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
        {import.meta.env.DEV && (
          <Tab title='RDF Graph' id='rdf' disabled={!loaded}>
            <RDFGraphView {...props} />
          </Tab>
        )}
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
