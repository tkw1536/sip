import { readFileSync } from 'fs'
import { join } from 'path'
import { Marked } from 'marked'
import markedFootnote from 'marked-footnote'

import {
  type CompileTimeFunctionArgs,
  type CompileTimeFunctionResult,
} from 'vite-plugin-compile-time'

const marked = new Marked()
marked.use(markedFootnote())

/** converts the given markdown file into html */
function markdownAsHTML(path: string): string {
  // eslint-disable-line @typescript-eslint/no-invalid-void-type
  const contents = readFileSync(path, 'utf-8').toString()
  return marked.parse(contents) as string
}

const DOCS_PATH = join(__dirname, '..', 'docs', 'bluenote.md')

/** generates a legal disclaimer to include */
export default function generateDocs(
  args: CompileTimeFunctionArgs,
): CompileTimeFunctionResult {
  // eslint-disable-line @typescript-eslint/no-invalid-void-type
  return {
    watchFiles: [DOCS_PATH],
    data: markdownAsHTML(DOCS_PATH),
  }
}

// spellchecker:words bluenote
