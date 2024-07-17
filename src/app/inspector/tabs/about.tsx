import { type VNode } from 'preact'
import { LegalDisclaimer } from '../../../components/legal'

import HTML from '../../../components/html'

const html = import.meta.compileTime<string>('../../../../macros/docs/inspector.ts') // prettier-ignore

export default function DocsTab(): VNode<any> {
  return (
    <HTML html={html} trim={false} components={{ Legal: LegalDisclaimer }} />
  )
}
