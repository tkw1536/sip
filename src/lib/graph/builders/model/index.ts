import GraphBuilder from '..'
import Deduplication from '../../../../app/inspector/state/state/deduplication'
import { type PathTree } from '../../../pathbuilder/pathtree'
import type SpecificBuilder from './specific'
import { type ModelEdge, type ModelNode, type SharedOptions } from './specific'
import BundleBuilder from './specific_bundle'
import FullBuilder from './specific_full'
import NoneBuilder from './specific_none'

export type Options = SharedOptions & {
  deduplication?: Deduplication
}

/** builds a new graph for a specific model */
export default class ModelGraphBuilder extends GraphBuilder<
  ModelNode,
  ModelEdge
> {
  readonly #specific: SpecificBuilder
  constructor(tree: PathTree, options: Options) {
    super()

    const { deduplication, ...specificOptions } = options
    switch (options.deduplication) {
      case Deduplication.Full:
        this.#specific = new FullBuilder(tree, specificOptions, this.graph)
        break
      case Deduplication.None:
        this.#specific = new NoneBuilder(tree, specificOptions, this.graph)
        break
      case Deduplication.Bundle:
        this.#specific = new BundleBuilder(tree, specificOptions, this.graph)
        break
      default:
        throw new Error('unknown specific builder')
    }
  }

  protected async doBuild(): Promise<void> {
    this.#specific.build()
  }
}
