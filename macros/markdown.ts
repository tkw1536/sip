import { readFileSync } from 'fs'
import { join } from 'path'
import { Marked } from 'marked'
import type { MacroContext } from '@parcel/macros'
import markedFootnote from 'marked-footnote'

const marked = new Marked()
marked.use(markedFootnote())

/** converts the given markdown file into html */
export function markdownAsHTML (this: MacroContext | undefined, ...path: string[]): string {
  const file = join(__dirname, '..', ...path)
  this?.invalidateOnFileChange(file)

  const contents = readFileSync(file).toString()

  return marked.parse(contents) as string
}
