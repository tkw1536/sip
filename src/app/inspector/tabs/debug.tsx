import { Component, type ComponentChildren } from 'preact'
import { Loader } from '../../../components/loader/loader'
import { type IReducerProps } from '../state'

export default class DebugTab extends Component<IReducerProps> {
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
