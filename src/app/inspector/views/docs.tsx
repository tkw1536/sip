import { Component, type ComponentChildren } from 'preact'

import * as styles from './docs.module.css'
import { classes } from '../../../lib/utils/classes'
import Markup from 'preact-markup'

const html = import.meta.compileTime<string>('../../../../macros/docs/inspector.ts') // prettier-ignore

export default class DocsView extends Component<Record<never, never>> {
  render(): ComponentChildren {
    return (
      <div class={classes(styles.container)}>
        <Markup markup={html} type='html' />
      </div>
    )
  }
}
