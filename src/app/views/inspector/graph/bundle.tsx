import { Component, createRef, type ComponentChildren } from 'preact'
import GraphDisplay, { DriverControl, ExportControl } from '.'
import type GraphBuilder from '../../../../lib/graph/builders'
import BundleGraphBuilder, { type BundleEdge, type BundleNode } from '../../../../lib/graph/builders/bundle'
import { bundles } from '../../../../lib/drivers/collection'
import { type ReducerProps } from '../../../state'
import type Driver from '../../../../lib/drivers/impl'
import { setBundleDriver, setBundleLayout } from '../../../state/reducers/inspector/bundle'

export default class BundleGraphView extends Component<ReducerProps> {
  private readonly builder = async (): Promise<GraphBuilder<BundleNode, BundleEdge>> => {
    const { tree, selection } = this.props.state
    return await Promise.resolve(new BundleGraphBuilder(tree, selection))
  }

  private readonly displayRef = createRef<GraphDisplay<BundleNode, BundleEdge>>()

  render (): ComponentChildren {
    const { bundleGraphLayout, bundleGraphDriver: bundleGraphRenderer, pathbuilderVersion, selectionVersion, colorVersion, ns, cm } = this.props.state

    return (
      <GraphDisplay
        ref={this.displayRef}
        loader={bundles}
        driver={bundleGraphRenderer}
        builderKey={`${pathbuilderVersion}-${selectionVersion}-${colorVersion}`}
        builder={this.builder}
        ns={ns} cm={cm}
        layout={bundleGraphLayout}
        panel={this.renderPanel}
      />
    )
  }

  private readonly handleChangeBundleRenderer = (value: string): void => {
    this.props.apply(setBundleDriver(value))
  }

  private readonly handleChangeBundleLayout = (value: string): void => {
    this.props.apply(setBundleLayout(value))
  }

  private readonly renderPanel = (driver: Driver<BundleNode, BundleEdge> | null): ComponentChildren => {
    const { state: { bundleGraphLayout } } = this.props

    return (
      <>
        <DriverControl
          driverNames={bundles.names}
          driver={driver}
          currentLayout={bundleGraphLayout}
          onChangeDriver={this.handleChangeBundleRenderer}
          onChangeLayout={this.handleChangeBundleLayout}
        />
        <ExportControl driver={driver} display={this.displayRef.current} />
      </>
    )
  }
}
