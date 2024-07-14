import {
  type CompileTimeFunctionArgs,
  type CompileTimeFunctionResult,
} from 'vite-plugin-compile-time'
import markdownAsHTML from '.'
import { join } from 'path'

const DOCS_PATH = join(__dirname, 'rdf.md')

/** generates a legal disclaimer to include */
export default function generateDocs(
  args: CompileTimeFunctionArgs,
): CompileTimeFunctionResult {
  return {
    watchFiles: [DOCS_PATH],
    data: markdownAsHTML(DOCS_PATH),
  }
}
