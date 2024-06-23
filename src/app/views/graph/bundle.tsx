import { ComponentChild } from 'preact'
import GraphView from '.'
import GraphBuilder from '../../../lib/graph/builders'
import BundleGraphBuilder, { BundleEdge, BundleNode } from '../../../lib/graph/builders/bundle'
import { bundles } from '../../state/drivers'
import { Driver } from './renderers'

export default class BundleGraphView extends GraphView<BundleNode, BundleEdge> {
  protected readonly layoutKey = 'bundleGraphLayout'

  protected newDriver (previousProps: typeof this.props): boolean {
    return this.props.bundleGraphRenderer !== previousProps.bundleGraphRenderer
  }

  protected async makeRenderer (): Promise<Driver<BundleNode, BundleEdge>> {
    return await bundles.get(this.props.bundleGraphRenderer)
  }

  protected async makeGraphBuilder (): Promise<GraphBuilder<BundleNode, BundleEdge>> {
    const { tree, selection } = this.props
    return await Promise.resolve(new BundleGraphBuilder(tree, selection))
  }

  protected newGraphBuilder (previousProps: typeof this.props): boolean {
    return false
  }

  protected renderPanel (): ComponentChild {
    return null
  }
}
