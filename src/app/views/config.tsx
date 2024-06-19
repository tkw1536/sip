import { h, Component, Fragment, ComponentChild } from 'preact'
import type { ViewProps } from '../viewer'
import { bundles, models } from '../state/renderers'
import AsyncArraySelector from '../../lib/components/async-array-selector'

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
          <AsyncArraySelector value={bundleGraphRenderer} onInput={handleSetBundleRenderer} load={bundles.names} />
        </p>

        <p>
          Model Graph Renderer: &nbsp;
          <AsyncArraySelector onInput={handleSetModelRenderer} value={modelGraphRenderer} load={models.names} />
        </p>
      </Fragment>
    )
  }
}
