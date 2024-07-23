import { Component, type ComponentChildren, createRef } from 'preact'
import GraphDisplay, {
  DriverControl,
  ExportControl,
} from '../../../components/graph-display'
import BundleGraphBuilder, {
  type BundleOptions,
  type BundleEdge,
  type BundleNode,
} from '../../../lib/graph/builders/bundle'
import { bundles } from '../../../lib/drivers/collection'
import { type IReducerProps } from '../state'
import type Driver from '../../../lib/drivers/impl'
import {
  setBundleDriver,
  setBundleLayout,
  setBundleSeed,
} from '../state/reducers/bundle'
import type Graph from '../../../lib/graph'

export default class BundleGraphView extends Component<IReducerProps> {
  readonly #builder = async (): Promise<Graph<BundleNode, BundleEdge>> => {
    const { tree, selection } = this.props.state

    const builder = new BundleGraphBuilder(tree, selection)
    return await builder.build()
  }

  readonly #displayRef =
    createRef<GraphDisplay<BundleNode, BundleEdge, BundleOptions, never>>()

  render(): ComponentChildren {
    const {
      bundleGraphLayout,
      bundleGraphDriver: bundleGraphRenderer,
      bundleGraphSeed,
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
        seed={bundleGraphSeed}
        builderKey={`${pathbuilderVersion}-${selectionVersion}-${colorVersion}`}
        makeGraph={this.#builder}
        options={{ ns, cm }}
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
  readonly #handleChangeBundleSeed = (seed: number | null): void => {
    this.props.apply(setBundleSeed(seed))
  }
  readonly #handleResetDriver = (): void => {
    const { current: display } = this.#displayRef
    display?.remount()
  }

  readonly #renderPanel = (
    driver: Driver<BundleNode, BundleEdge, BundleOptions, never> | null,
    animating: boolean | null,
  ): ComponentChildren => {
    const {
      state: { bundleGraphLayout, bundleGraphSeed },
    } = this.props

    return (
      <>
        <DriverControl
          driverNames={bundles.names}
          driver={driver}
          currentLayout={bundleGraphLayout}
          seed={bundleGraphSeed}
          onChangeDriver={this.#handleChangeBundleRenderer}
          onChangeLayout={this.#handleChangeBundleLayout}
          onChangeSeed={this.#handleChangeBundleSeed}
          onResetDriver={this.#handleResetDriver}
          animating={animating}
        />
        <ExportControl driver={driver} display={this.#displayRef.current} />
      </>
    )
  }
}
