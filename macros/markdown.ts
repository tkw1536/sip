import { readFileSync } from 'fs'
import { Marked, type RendererObject, type Renderer } from 'marked'
import markedFootnote from 'marked-footnote'
import { join } from 'path'

const marked = new Marked()
marked.use(markedFootnote())

const renderer: RendererObject = {
  // @ts-expect-error the typing for marked are incorrect, and this is the correct signature
  link(
    this: Renderer,
    href: string,
    title: string | null,
    text: string,
  ): string {
    // check for an internal url
    const isInternal =
      href.startsWith('.') ||
      href.startsWith('/') ||
      href.startsWith('#') ||
      href.startsWith('?')

    let out = '<a href="' + href + '"'
    if (title !== null) {
      out += ' title="' + title + '"'
    }
    if (!isInternal) {
      // spellchecker:words noopener noreferrer
      out += ' target="_blank" rel="noopener noreferrer"'
    }
    out += '>' + text + '</a>'
    return out
  },
}
marked.use({ renderer })

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
