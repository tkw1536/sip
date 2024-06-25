import { Component, ComponentChild } from 'preact'
import { bundles, models } from '../../lib/drivers/collection'
import ValueSelector from '../../lib/components/selector'
import { ReducerProps } from '../state'
import { setBundleDriver } from '../state/reducers/inspector/bundle'
import { setBundleDriver } from '../state/reducers/inspector/model'

export default class GraphConfigView extends Component<ReducerProps> {
  private readonly handleBundleRender = (renderer: string): void => {
    this.props.apply(setBundleDriver(renderer))
  }

  private readonly handleModelRenderer = (renderer: string): void => {
    this.props.apply(setBundleDriver(renderer))
  }

  render (): ComponentChild {
    const { bundleGraphDriver: bundleGraphRenderer, modelGraphDriver: modelGraphRenderer } = this.props.state

    return (
      <>
        <p>
          The graph views support multiple graph rendering backends.
          These are powered by different libraries and will look slightly different.
        </p>

        <p>
          Bundle Graph Renderer: &nbsp;
          <ValueSelector values={bundles.names} value={bundleGraphRenderer} onInput={this.handleBundleRender} />
        </p>

        <p>
          Model Graph Renderer: &nbsp;
          <ValueSelector values={models.names} value={modelGraphRenderer} onInput={this.handleModelRenderer} />
        </p>
      </>
    )
  }
}
