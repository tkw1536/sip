import { type JSX, type ComponentChildren } from 'preact'
import { classes } from '../../lib/utils/classes'
import * as styles from './index.module.css'
import getVersionInfo from '../../../macros/version' with { type: 'macro' }

const version = getVersionInfo()

export default function Layout(props: {
  children: ComponentChildren
}): JSX.Element {
  return (
    <>
      <main class={classes(styles.main)}>{props.children}</main>
      <footer class={classes(styles.footer)}>
        &copy; Tom Wiesing. All rights reserved. {` `}
        <a
          href={'https://inform.everyone.wtf'}
          target='_blank'
          rel='noopener noreferrer'
        >
          Imprint & Privacy Policy
        </a>
        . {` `}
        <a
          href={'https://github.com/tkw1536/sip'}
          target='_blank'
          rel='noopener noreferrer'
        >
          Source Code
        </a>
        .{` `}
        <code>
          {version.version} / {version.git} / {version.compileTime}
        </code>
      </footer>
    </>
  )
}
