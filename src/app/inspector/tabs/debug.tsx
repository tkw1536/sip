import { Component, type ComponentChildren } from 'preact'
import Spinner from '../../../components/spinner'
import { type IReducerProps } from '../state'

export default class DebugTab extends Component<IReducerProps> {
  render(): ComponentChildren {
    return (
      <>
        <h2>Debug Page</h2>

        <Spinner message='Your message here' />
      </>
    )
  }
}

// spellchecker:words bluenote
