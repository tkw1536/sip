import { Component, type ComponentChildren } from 'preact'
import { Loader } from '../../lib/drivers/loader'
import { type ReducerProps } from '../state'

export default class DebugView extends Component<ReducerProps> {
  render (): ComponentChildren {
    return (
      <>
        <h2>Debug Page</h2>

        <Loader message='Your message here' />
      </>
    )
  }
}

// spellchecker:words bluenote
