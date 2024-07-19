import {
  Component,
  type ComponentChild,
  type ComponentChildren,
  Fragment,
  createRef,
} from 'preact'
import download from '../../lib/utils/download'
import Kernel, { type DriverLoader } from '../../lib/drivers'
import type Graph from '../../lib/graph'

import * as styles from './index.module.css'
import { classes } from '../../lib/utils/classes'
import { Operation } from '../../lib/utils/operation'
import type Driver from '../../lib/drivers/impl'
import ValueSelector from '../selector'
import ErrorDisplay from '../error'

interface GraphProps<NodeLabel, EdgeLabel, Options> {
  loader: DriverLoader<NodeLabel, EdgeLabel, Options>
  driver: string

  builderKey: string
  makeGraph: () => Promise<Graph<NodeLabel, EdgeLabel>>

  options: Options
  layout: string

  panel?:
    | ComponentChildren
    | ((
        driver: Driver<NodeLabel, EdgeLabel, Options> | null,
      ) => ComponentChildren)
}

interface GraphState<NodeLabel, EdgeLabel, Options> {
  open: boolean

  graph?: Graph<NodeLabel, EdgeLabel>
  graphError?: any

  driver: Driver<NodeLabel, EdgeLabel, Options> | null
}

export default class GraphDisplay<
  NodeLabel,
  EdgeLabel,
  Options,
> extends Component<
  GraphProps<NodeLabel, EdgeLabel, Options>,
  GraphState<NodeLabel, EdgeLabel, Options>
> {
  state: GraphState<NodeLabel, EdgeLabel, Options> = {
    open: false,
    driver: null,
  }

  protected makeRenderer(): {
    name: string
    loader: DriverLoader<NodeLabel, EdgeLabel, Options>
  } {
    return { name: this.props.driver, loader: this.props.loader }
  }

  protected newGraphBuilder(previousProps: typeof this.props): boolean {
    return this.props.builderKey !== previousProps.builderKey
  }

  protected renderPanel(): ComponentChildren {
    const { panel } = this.props
    const { driver } = this.state
    if (typeof panel === 'function') {
      return panel(driver)
    }
    return panel
  }

  readonly export = (format: string, evt?: Event): void => {
    if (evt != null) evt.preventDefault()

    const { current: kernel } = this.#kernelRef
    if (kernel === null) return

    kernel
      .exportBlob(format)
      .then(async (blob): Promise<void> => {
        download(blob, undefined, format)
      })
      .catch((e: unknown) => {
        console.error('failed to download: ', e)
        alert('Download has failed: ' + JSON.stringify(e))
      })
  }

  readonly #handleToggle = (evt: Event): void => {
    evt.preventDefault()
    this.setState(({ open }) => ({ open: !open }))
  }

  readonly #kernelRef = createRef<Kernel<NodeLabel, EdgeLabel, Options>>()

  componentDidMount(): void {
    void this.#buildGraphModel()
  }

  componentWillUnmount(): void {
    this.#graphOperation.cancel()
    this.#rendererOperation.cancel()
  }

  readonly #graphOperation = new Operation()
  readonly #buildGraphModel = async (): Promise<void> => {
    const ticket = this.#graphOperation.ticket()

    let graph: Graph<NodeLabel, EdgeLabel>
    try {
      graph = await this.props.makeGraph()
    } catch (e) {
      this.setState({ graph: undefined, graphError: e })
      return
    }

    this.setState(() => {
      if (!ticket()) return null
      return { graph, graphError: undefined }
    })
  }

  readonly #rendererOperation = new Operation()
  componentDidUpdate(previousProps: typeof this.props): void {
    // builder has changed => return a new changer
    if (this.newGraphBuilder(previousProps)) {
      void this.#buildGraphModel()
    }
  }

  render(): ComponentChild {
    const main = this.#renderMain()
    const panel = this.renderPanel()

    // if we have no children, don't render a panel
    if (
      typeof panel === 'undefined' ||
      panel === null ||
      typeof panel === 'boolean' ||
      (Array.isArray(panel) && panel.length === 0)
    ) {
      return main
    }

    const { open } = this.state
    return (
      <div class={styles.wrapper}>
        <div
          class={classes(
            styles.options,
            open ? styles.optionsOpen : styles.optionsClosed,
          )}
        >
          {panel}
        </div>
        <button class={styles.handle} onClick={this.#handleToggle}>
          {open ? '<<' : '>>'}
        </button>
        <div class={styles.main}>{main}</div>
      </div>
    )
  }

  readonly #driverRef = (
    driver: Driver<NodeLabel, EdgeLabel, Options> | null,
  ): void => {
    this.setState({ driver })
  }

  #renderMain(): ComponentChild {
    const { graph, graphError } = this.state

    if (typeof graphError !== 'undefined') {
      return <ErrorDisplay error={graphError} />
    }

    if (graph == null) {
      return null
    }

    const { name, loader } = this.makeRenderer()

    const { options, layout } = this.props
    return (
      <Kernel
        ref={this.#kernelRef}
        graph={graph}
        options={options}
        loader={loader}
        driver={name}
        layout={layout}
        driverRef={this.#driverRef}
      />
    )
  }
}

/**
 * A control to pick which driver to control.
 */
export class DriverControl<NodeLabel, EdgeLabel, Options> extends Component<{
  driverNames: string[]
  driver: Driver<NodeLabel, EdgeLabel, Options> | null

  currentLayout?: string

  onChangeDriver: (driver: string) => void
  onChangeLayout: (layout: string) => void
}> {
  readonly #handleChangeDriver = (driver: string): void => {
    this.props.onChangeDriver(driver)
  }

  readonly #handleChangeLayout = (layout: string): void => {
    this.props.onChangeLayout(layout)
  }

  render(): ComponentChildren {
    const { driver, driverNames, currentLayout } = this.props

    return (
      <Control name='Renderer'>
        <p>
          This graph can be shown using different renderers. Each renderer
          supports different layouts.
        </p>
        <p>Changing either value will update the graph.</p>
        <p>
          Renderer: &nbsp;
          <ValueSelector
            values={driverNames}
            value={driver?.driverName}
            onInput={this.#handleChangeDriver}
          />
          &nbsp; Layout: &nbsp;
          <ValueSelector
            disabled={driver === null}
            value={currentLayout}
            values={driver?.supportedLayouts}
            onInput={this.#handleChangeLayout}
          />
        </p>
      </Control>
    )
  }
}

export class ExportControl<NodeLabel, EdgeLabel, Options> extends Component<{
  driver: Driver<NodeLabel, EdgeLabel, Options> | null
  display: GraphDisplay<NodeLabel, EdgeLabel, Options> | null
}> {
  readonly #handleExport = (format: string, event: Event): void => {
    event.preventDefault()
    const { driver, display } = this.props
    if (driver === null || display === null) {
      console.warn('handleExport called without mounted display')
      return
    }

    display.export(format)
  }

  render(): ComponentChildren {
    // check that there are some export formats
    const exportFormats = this.props.driver?.supportedExportFormats
    if (typeof exportFormats === 'undefined' || exportFormats.length === 0) {
      return null
    }
    return (
      <Control name='Graph Export'>
        <p>
          Click the button below to export the graph. Depending on the format
          and graph size, this might take a few seconds to generate.
        </p>
        <p>
          {exportFormats.map(format => (
            <Fragment key={format}>
              <button onClick={this.#handleExport.bind(this, format)}>
                {format}
              </button>
              &nbsp;
            </Fragment>
          ))}
        </p>
      </Control>
    )
  }
}

export class Control extends Component<{
  name: string
  children?: ComponentChildren
}> {
  render(): ComponentChildren {
    return (
      <fieldset>
        <legend>{this.props.name}</legend>
        {this.props.children}
      </fieldset>
    )
  }
}
