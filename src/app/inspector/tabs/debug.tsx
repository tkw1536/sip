import { Fragment, type JSX } from 'preact'
import Spinner from '../../../components/spinner'
import { Panel } from '../../../components/layout/panel'
import { useState } from 'preact/hooks'

export default function DebugTab(): JSX.Element {
  const panel = []
  for (let i = 0; i < 100; i++) {
    panel.push(
      <Fragment key={i}>
        Line {i} in panel
        <br />
      </Fragment>,
    )
  }

  const main = []
  for (let i = 0; i < 1000; i++) {
    main.push(
      <Fragment key={i}>
        Line {i} in main
        <br />
      </Fragment>,
    )
  }

  const [open, setOpen] = useState(true)

  return (
    <Panel
      panel={<>{panel}</>}
      open={open}
      setOpen={setOpen}
      margin='10px'
      width='10vw'
    >
      <h2>Debug Page</h2>

      <Spinner message='Your message here' />

      {main}
    </Panel>
  )
}

// spellchecker:words bluenote
