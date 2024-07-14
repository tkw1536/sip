import { readFileSync } from 'fs'
import { Marked } from 'marked'
import markedFootnote from 'marked-footnote'

const marked = new Marked()
marked.use(markedFootnote())

/** converts the given markdown file into html */
export default function markdownAsHTML(path: string): string {
  const contents = readFileSync(path, 'utf-8').toString()
  return marked.parse(contents) as string
}
