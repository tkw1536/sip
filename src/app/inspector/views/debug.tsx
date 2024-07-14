import { Component, type ComponentChildren } from 'preact'
import { Loader } from '../../../lib/components/loader/loader'
import { type IReducerProps } from '../state'

export default class DebugView extends Component<IReducerProps> {
  render(): ComponentChildren {
    return (
      <>
        <h2>Debug Page</h2>

        <Loader message='Your message here' />
      </>
    )
  }
}

// spellchecker:words bluenote
