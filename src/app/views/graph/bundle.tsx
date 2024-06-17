import { ComponentChild } from 'preact'
import GraphView from '.'
import GraphBuilder from '../../../lib/builders'
import BundleGraphBuilder, { BundleEdge, BundleNode } from '../../../lib/builders/bundle'
import { BundleRenderer, bundles } from '../../state/renderers'

export default class BundleGraphView extends GraphView<BundleRenderer, BundleNode, BundleEdge, any> {
  protected readonly layoutKey = 'bundleGraphLayout'

  protected newRenderer (previousProps: typeof this.props): boolean {
    return this.props.bundleGraphRenderer !== previousProps.bundleGraphRenderer
  }

  protected async makeRenderer (): Promise<BundleRenderer> {
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
