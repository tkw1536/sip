import { h, Component, Fragment, ComponentChild } from 'preact'
import type { ViewProps } from '../viewer'
import { bundles, models } from '../state/renderers'
import ValueSelector from '../../lib/components/selector'

export default class GraphConfigView extends Component<ViewProps> {
  render (): ComponentChild {
    const { bundleGraphRenderer, modelGraphRenderer, setBundleRenderer: handleSetBundleRenderer, setModelRenderer: handleSetModelRenderer } = this.props

    return (
      <Fragment>
        <p>
          The graph views support multiple graph rendering backends.
          These are powered by different libraries and will look slightly different.
        </p>

        <p>
          Bundle Graph Renderer: &nbsp;
          <ValueSelector values={bundles.names} value={bundleGraphRenderer} onInput={handleSetBundleRenderer} />
        </p>

        <p>
          Model Graph Renderer: &nbsp;
          <ValueSelector values={models.names} onInput={handleSetModelRenderer} value={modelGraphRenderer} />
        </p>
      </Fragment>
    )
  }
}
