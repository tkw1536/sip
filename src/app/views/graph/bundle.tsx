import { Component, ComponentChildren } from 'preact'
import GraphDisplay from '.'
import GraphBuilder from '../../../lib/graph/builders'
import BundleGraphBuilder, { BundleEdge, BundleNode } from '../../../lib/graph/builders/bundle'
import { bundles } from '../../../lib/drivers/collection'
import { ViewProps } from '../../viewer'

export default class BundleGraphView extends Component<ViewProps> {
  private readonly builder = async (): Promise<GraphBuilder<BundleNode, BundleEdge>> => {
    const { tree, selection } = this.props
    return await Promise.resolve(new BundleGraphBuilder(tree, selection))
  }

  render (): ComponentChildren {
    const { bundleGraphLayout, bundleGraphRenderer, pathbuilderVersion, selectionVersion, ns } = this.props

    return (
      <GraphDisplay
        loader={bundles}
        driver={bundleGraphRenderer}
        builderKey={`${pathbuilderVersion}-${selectionVersion}`}
        builder={this.builder}
        ns={ns}
        layout={bundleGraphLayout}
      />
    )
  }
}
