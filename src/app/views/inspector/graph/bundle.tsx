import { Component, type ComponentChildren } from 'preact'
import GraphDisplay from '.'
import type GraphBuilder from '../../../../lib/graph/builders'
import BundleGraphBuilder, { type BundleEdge, type BundleNode } from '../../../../lib/graph/builders/bundle'
import { bundles } from '../../../../lib/drivers/collection'
import { type ReducerProps } from '../../../state'

export default class BundleGraphView extends Component<ReducerProps> {
  private readonly builder = async (): Promise<GraphBuilder<BundleNode, BundleEdge>> => {
    const { tree, selection } = this.props.state
    return await Promise.resolve(new BundleGraphBuilder(tree, selection))
  }

  render (): ComponentChildren {
    const { bundleGraphLayout, bundleGraphDriver: bundleGraphRenderer, pathbuilderVersion, selectionVersion, colorVersion, ns, cm } = this.props.state

    return (
      <GraphDisplay
        loader={bundles}
        driver={bundleGraphRenderer}
        builderKey={`${pathbuilderVersion}-${selectionVersion}-${colorVersion}`}
        builder={this.builder}
        ns={ns} cm={cm}
        layout={bundleGraphLayout}
      />
    )
  }
}
