import { type VNode } from 'preact'
import HTML from '../../../components/html'

const html = import.meta.compileTime<string>('../../../../macros/docs/rdf.ts') // prettier-ignore

export default function DocsTab(): VNode<any> {
  return <HTML html={html} trim={false} />
}
