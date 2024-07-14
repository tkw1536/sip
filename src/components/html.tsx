import { type VNode } from 'preact'

import * as styles from './html.module.css'
import Markup from 'preact-markup'
import { classes } from '../lib/utils/classes'

export default function HTML({ html }: { html: string }): VNode<any> {
  return (
    <div class={classes(styles.container)}>
      <Markup markup={html} type='html' />
    </div>
  )
}
