import { type JSX } from 'preact'
import Spinner from '../../../components/spinner'
import { type IReducerProps } from '../state'

export default function DebugTab(props: IReducerProps): JSX.Element {
  return (
    <>
      <h2>Debug Page</h2>

      <Spinner message='Your message here' />
    </>
  )
}

// spellchecker:words bluenote
