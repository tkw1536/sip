import Graph from '..'
import ArrayTracker from '../../utils/array-tracker'
import Once from '../../utils/once'

export default abstract class GraphBuilder<NodeLabel, EdgeLabel> {
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
