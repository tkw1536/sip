import { type VNode } from 'preact'
import Legal from '../../../components/legal'

export default function AboutTab(): VNode<any> {
  return (
    <>
      <h2>About SIP</h2>

      <p>
        SIP is a tool provides an interface for inspecting{' '}
        <code>Pathbuilders</code> created by the{' '}
        <a href='https://wiss-ki.eu' target='_blank' rel='noopener noreferrer'>
          WissKI
        </a>{' '}
        software. It was built in 2024 by <em>Tom Wiesing</em> with the primary
        purpose to provide a better interface than plain WissKI.
      </p>

      <h3>License</h3>
      <Legal />
    </>
  )
}
