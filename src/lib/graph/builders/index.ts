import Graph from '..'
import ArrayTracker from '../../utils/array-tracker'

export default abstract class GraphBuilder<
  NodeLabel extends Renderable<Options, AttachmentKey>,
  EdgeLabel extends Renderable<Options, AttachmentKey>,
  Options,
  AttachmentKey extends string,
> {
  protected readonly graph = new Graph<NodeLabel, EdgeLabel>(false)
  protected readonly tracker = new ArrayTracker<string>()

  #done = false
  build(): typeof this.graph {
    // TODO: in dev, always rebuild
    if (!this.#done) {
      this.doBuild()
      this.#done = true
    }
    return this.graph
  }

  /** doBuild builds the actual graph */
  protected abstract doBuild(): void
}

/** Something that can be rendered onto the page */
export interface Renderable<Options, Key extends string> {
  render: (id: string, options: Options) => ElementWithAttachments<Key>
}

/** A unit that can be rendered onto a page  */
export interface ElementWithAttachments<Key extends string> extends Element {
  attached?: {
    boxed: boolean
    elements: Record<Key, Attachment[]>
  }
}

/** something that can be rendered onto the page */
export interface Element {
  id: string
  label: string | null
  tooltip: string | null
  color: string | null
}

/** an element attached to an existing node */
export interface Attachment {
  node: Element
  edge: Element
}
