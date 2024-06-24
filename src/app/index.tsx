import { Component, ComponentChild } from 'preact'
import { Viewer } from './viewer'
import Loader from './loader'
import * as styles from './index.module.css'
import { WithID } from '../lib/components/wrapper'
import { classes } from '../lib/utils/classes'
import { resetInterface } from './state/reducers/init'
import { Reducer, ReducerProps, State } from './state'
import { Operation } from '../lib/utils/operation'

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

export const App = WithID<{}>(class App extends Component<{ id: string }, State> {
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
        {this.state.loaded === true ? <Viewer {...props} /> : <Loader {...props} />}
      </Wrapper>
    )
  }
})
