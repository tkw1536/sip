import { readFileSync } from 'fs'
import { Marked } from 'marked'
import markedFootnote from 'marked-footnote'
import { join } from 'path'

const marked = new Marked()
marked.use(markedFootnote())

const DOCS_DIR = join(__dirname, '..', 'docs')

/** reads a markdown document from the folder and returns it as html */
export default function markdownDocument(
  this: MacroContext | void,
  name: string,
): string {
  const path = join(DOCS_DIR, name)
  this?.invalidateOnFileChange(path)

  const contents = readFileSync(path, 'utf-8').toString()
  return marked.parse(contents) as string
}
