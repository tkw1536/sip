import { Component, type ComponentChildren } from 'preact'
import { markdownAsHTML } from '../../../macros/markdown' with {type: 'macro'}

import * as styles from './docs.module.css'
import { classes } from '../../lib/utils/classes'
import Markup from 'preact-markup'

const html = markdownAsHTML('docs', 'bluenote.md')

export default class DocsView extends Component<Record<never, never>> {
  render (): ComponentChildren {
    return (
      <div class={classes(styles.container)}>
        <Markup markup={html} type='html' />
      </div>
    )
  }
}

// spellchecker:words bluenote
