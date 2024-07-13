import { Component, type ComponentChildren, createRef } from 'preact'
import GraphDisplay, { DriverControl, ExportControl } from '.'
import BundleGraphBuilder, {
  type BundleEdge,
  type BundleNode,
} from '../../../../../lib/graph/builders/bundle'
import { bundles } from '../../../../../lib/drivers/collection'
import { type ReducerProps } from '../../../state'
import type Driver from '../../../../../lib/drivers/impl'
import {
  setBundleDriver,
  setBundleLayout,
} from '../../../state/reducers/inspector/bundle'
import type Graph from '../../../../../lib/graph'

export default class BundleGraphView extends Component<ReducerProps> {
  readonly #builder = async (): Promise<Graph<BundleNode, BundleEdge>> => {
    const { tree, selection } = this.props.state

    const builder = new BundleGraphBuilder(tree, selection)
    return await builder.build()
  }

  readonly #displayRef = createRef<GraphDisplay<BundleNode, BundleEdge>>()

  render(): ComponentChildren {
    const {
      bundleGraphLayout,
      bundleGraphDriver: bundleGraphRenderer,
      pathbuilderVersion,
      selectionVersion,
      colorVersion,
      ns,
      cm,
    } = this.props.state

    return (
      <GraphDisplay
        ref={this.#displayRef}
        loader={bundles}
        driver={bundleGraphRenderer}
        builderKey={`${pathbuilderVersion}-${selectionVersion}-${colorVersion}`}
        makeGraph={this.#builder}
        ns={ns}
        cm={cm}
        layout={bundleGraphLayout}
        panel={this.#renderPanel}
      />
    )
  }

  readonly #handleChangeBundleRenderer = (value: string): void => {
    this.props.apply(setBundleDriver(value))
  }

  readonly #handleChangeBundleLayout = (value: string): void => {
    this.props.apply(setBundleLayout(value))
  }

  readonly #renderPanel = (
    driver: Driver<BundleNode, BundleEdge> | null,
  ): ComponentChildren => {
    const {
      state: { bundleGraphLayout },
    } = this.props

    return (
      <>
        <DriverControl
          driverNames={bundles.names}
          driver={driver}
          currentLayout={bundleGraphLayout}
          onChangeDriver={this.#handleChangeBundleRenderer}
          onChangeLayout={this.#handleChangeBundleLayout}
        />
        <ExportControl driver={driver} display={this.#displayRef.current} />
      </>
    )
  }
}
