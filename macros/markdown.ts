import { readFileSync } from 'fs'
import { join } from 'path'
import { Marked } from 'marked'
import markedFootnote from 'marked-footnote'

const marked = new Marked()
marked.use(markedFootnote())

/** converts the given markdown file into html */
export function markdownAsHTML (...path: string[]): string {
  const file = join(__dirname, '..', ...path)
  const contents = readFileSync(file).toString()

  return marked.parse(contents) as string
}
