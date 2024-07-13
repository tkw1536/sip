import { Component, type ComponentChildren } from 'preact'
import { classes } from '../../utils/classes'
import * as styles from './index.module.css'

export default class Layout extends Component {
  render(): ComponentChildren {
    const { children } = this.props
    return (
      <>
        <main class={classes(styles.main)}>{children}</main>
        <footer class={classes(styles.footer)}>
          &copy; Tom Wiesing 2024. All rights reserved.
        </footer>
      </>
    )
  }
}
