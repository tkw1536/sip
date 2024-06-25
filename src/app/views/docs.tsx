import { Component, ComponentChildren, VNode } from 'preact'
import Markdown from 'preact-markdown'

import * as styles from './docs.module.css'
import { classes } from '../../lib/utils/classes'

export default class DocsView extends Component<{}, { content?: VNode }> {
  state: { content?: VNode } = { }

  private async markdown (): Promise<VNode> {
    const content = await import('bundle-text:../../../docs/bluenote.md') as unknown as string
    return Markdown(content)
  }

  private mounted = false
  componentDidMount (): void {
    this.mounted = true
    this.markdown()
      .then(content => {
        if (!this.mounted) return
        this.setState({ content })
      })
      .catch(e => {
        console.error('error rendering markdown: ', e)
      })
  }

  componentWillUnmount (): void {
    this.mounted = false
  }

  render (): ComponentChildren {
    const { content } = this.state
    if (typeof content === 'undefined') return null

    return (
      <div class={classes(styles.container)}>
        {content}
      </div>
    )
  }
}

// spellchecker:words bluenote
