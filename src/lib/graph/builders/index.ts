import Graph from '..'
import ArrayTracker from '../../utils/array-tracker'
import Once from '../../utils/once'

export default abstract class GraphBuilder<
  NodeLabel extends Renderable<Options, AttachmentKey>,
  EdgeLabel extends Renderable<Options, AttachmentKey>,
  Options,
  AttachmentKey extends string,
> {
  protected readonly graph = new Graph<NodeLabel, EdgeLabel>(false)
  protected readonly tracker = new ArrayTracker<string>()
  readonly #once = new Once()

  public async build(): Promise<typeof this.graph> {
    await this.#once.Do(async () => {
      await this.doBuild()
    })

    return this.graph
  }

  /** doBuild builds the actual graph */
  protected abstract doBuild(): Promise<void>
}

/** Something that can be rendered onto the page */
export interface Renderable<Options, Key extends string> {
  render: (id: string, options: Options) => ElementWithAttachments<Key>
}

/** A unit that can be rendered onto a page  */
export interface ElementWithAttachments<Key extends string> extends Element {
  attached?: Record<Key, Attachment[]>
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
