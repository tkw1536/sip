import { readFileSync } from 'fs'
import { join } from 'path'
import { Marked } from 'marked'
import type { MacroContext } from '@parcel/macros'
import markedFootnote from 'marked-footnote'

const marked = new Marked()
marked.use(markedFootnote())

/** converts the given markdown file into html */
export function markdownAsHTML (this: MacroContext | void, ...path: string[]): string { // eslint-disable-line @typescript-eslint/no-invalid-void-type
  const file = join(__dirname, '..', ...path)
  this?.invalidateOnFileChange(file)

  const contents = readFileSync(file, 'utf-8').toString()
  return marked.parse(contents) as string
}
