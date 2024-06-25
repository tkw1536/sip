import { Component, createRef, ComponentChild, Fragment, ComponentChildren } from 'preact'
import download from '../../../../lib/utils/download'
import Kernel, { DriverLoader } from '../../../../lib/drivers'
import Graph from '../../../../lib/graph'
import GraphBuilder from '../../../../lib/graph/builders'

import * as styles from './index.module.css'
import { classes } from '../../../../lib/utils/classes'
import { Operation } from '../../../../lib/utils/operation'
import Driver from '../../../../lib/drivers/impl'
import { NamespaceMap } from '../../../../lib/namespace'
import ColorMap from '../../../../lib/colormap'

interface GraphProps<NodeLabel, EdgeLabel> {
  loader: DriverLoader<NodeLabel, EdgeLabel>
  driver: string

  builderKey: string
  builder: () => Promise<GraphBuilder<NodeLabel, EdgeLabel>>

  ns: NamespaceMap
  cm: ColorMap
  layout: string

  panel?: ComponentChildren | ((driver: Driver<NodeLabel, EdgeLabel> | null) => ComponentChildren)
}

interface GraphState<NodeLabel, EdgeLabel> {
  open: boolean

  graph?: Graph<NodeLabel, EdgeLabel>
  graphError?: string

  driver: Driver<NodeLabel, EdgeLabel> | null
}

export default class GraphDisplay<NodeLabel, EdgeLabel> extends Component<GraphProps<NodeLabel, EdgeLabel>, GraphState<NodeLabel, EdgeLabel>> {
  state: GraphState<NodeLabel, EdgeLabel> = { open: false, driver: null }

  protected makeRenderer (): { name: string, loader: DriverLoader<NodeLabel, EdgeLabel> } {
    return { name: this.props.driver, loader: this.props.loader }
  }

  protected newGraphBuilder (previousProps: typeof this.props): boolean {
    return this.props.builderKey !== previousProps.builderKey
  }

  protected async makeGraphBuilder (): Promise<GraphBuilder<NodeLabel, EdgeLabel>> {
    return await this.props.builder()
  }

  protected renderPanel (): ComponentChildren {
    const { panel } = this.props
    const { driver } = this.state
    if (typeof panel === 'function') {
      return panel(driver)
    }
    return panel
  }

  readonly export = (format: string, evt?: Event): void => {
    if (evt != null) evt.preventDefault()

    const { current: kernel } = this.kernelRef
    if (kernel === null) return

    kernel.exportBlob(format)
      .then(async (blob): Promise<void> => await download(blob, undefined, format))
      .catch((e: unknown) => {
        console.error('failed to download: ', e)
        alert('Download has failed: ' + JSON.stringify(e))
      })
  }

  private readonly handleToggle = (evt: Event): void => {
    evt.preventDefault()
    this.setState(({ open }) => ({ open: !open }))
  }

  private readonly kernelRef = createRef<Kernel<NodeLabel, EdgeLabel>>()

  componentDidMount (): void {
    this.buildGraphModel()
  }

  componentWillUnmount (): void {
    this.graphOperation.cancel()
    this.rendererOperation.cancel()
  }

  private readonly graphOperation = new Operation()
  private readonly buildGraphModel = (): void => {
    const ticket = this.graphOperation.ticket()

    this.makeGraphBuilder().then(loader => {
      const graph = loader.build()
      this.setState(() => {
        if (!ticket()) return null
        return { graph, graphError: undefined }
      })
    }).catch(e => {
      this.setState({ graph: undefined, graphError: e.toString() })
    })
  }

  private readonly rendererOperation = new Operation()
  componentDidUpdate (previousProps: typeof this.props): void {
    // builder has changed => return a new changer
    if (
      this.newGraphBuilder(previousProps)
    ) {
      this.buildGraphModel()
    }
  }

  render (): ComponentChild {
    const main = this.renderMain()
    const panel = this.renderPanel()

    // if we have no children, don't render a panel
    if (typeof panel === 'undefined' || panel === null || typeof panel === 'boolean' || (Array.isArray(panel) && panel.length === 0)) {
      return main
    }

    const { open } = this.state
    return (
      <div class={styles.wrapper}>
        <div
          class={classes(styles.options, open ? styles.optionsOpen : styles.optionsClosed)}
        >{panel}
        </div>
        <button class={styles.handle} onClick={this.handleToggle}>
          {open ? '<<' : '>>'}
        </button>
        <div class={styles.main}>{main}</div>
      </div>
    )
  }

  private readonly driverRef = (driver: Driver<NodeLabel, EdgeLabel> | null): void => {
    this.setState({ driver })
  }

  private renderMain (): ComponentChild {
    const { graph, graphError } = this.state

    if (typeof graphError === 'string') {
      return (
        <>
          {typeof graphError === 'string' && <p><b>Error loading graph: </b>{graphError}</p>}
        </>
      )
    }

    if ((graph == null)) {
      return null
    }

    const { name, loader } = this.makeRenderer()

    const { ns, cm, layout } = this.props
    return (
      <Kernel
        ref={this.kernelRef}
        graph={graph} ns={ns} cm={cm}
        loader={loader} driver={name}
        layout={layout}
        driverRef={this.driverRef}
      />
    )
  }
}
