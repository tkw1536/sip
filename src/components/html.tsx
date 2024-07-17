import { type ComponentProps, type VNode } from 'preact'

import * as styles from './html.module.css'
import Markup from 'preact-markup'
import { classes } from '../lib/utils/classes'

type MarkupProps = ComponentProps<typeof Markup>
type HTMLProps = Omit<MarkupProps, 'type' | 'markup'> & { html: string }

export default function HTML({ html, ...rest }: HTMLProps): VNode<any> {
  return (
    <div class={classes(styles.container)}>
      <Markup markup={html} type='html' {...rest} />
    </div>
  )
}
