import { type JSX, type ComponentChildren } from 'preact'
import { classes } from '../../lib/utils/classes'
import * as styles from './index.module.css'

export default function Layout(props: {
  children: ComponentChildren
}): JSX.Element {
  return (
    <>
      <main class={classes(styles.main)}>{props.children}</main>
      <footer class={classes(styles.footer)}>
        &copy; Tom Wiesing 2024. All rights reserved.
      </footer>
    </>
  )
}
