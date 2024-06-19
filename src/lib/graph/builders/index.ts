import Graph from '..'
import ArrayTracker from '../../utils/array-tracker'

export default abstract class GraphBuilder<NodeLabel, EdgeLabel> {
  private done: boolean = false
  protected readonly graph = new Graph<NodeLabel, EdgeLabel>(false)
  protected readonly tracker = new ArrayTracker<string>()

  public build (): typeof this.graph {
    // ensure that we're only called once!
    if (this.done) {
      return this.graph
    }
    this.done = true

    this.doBuild()

    // and return the graph;
    return this.graph
  }

  /** doBuild builds the actual graph */
  protected abstract doBuild (): void
}
