import { h, Component, createRef, ComponentChild, Fragment } from 'preact'
import type { ViewProps } from '../../viewer'
import download from '../../../lib/utils/download'
import { GraphRendererClass, Renderer, defaultLayout } from './renderers'
import Graph from '../../../lib/graph'
import GraphBuilder from '../../../lib/graph/builders'

import * as styles from './index.module.css'
import { classes } from '../../../lib/utils/classes'

interface State<NodeLabel, EdgeLabel> {
  open: boolean,
  
  graph?: Graph<NodeLabel, EdgeLabel>,
  graphError?: string,
  
  renderer?: GraphRendererClass<NodeLabel, EdgeLabel, any>
  rendererLoading?: boolean,  
  rendererError?: string,
}

export default abstract class GraphView<R extends GraphRendererClass<NodeLabel, EdgeLabel, S>, NodeLabel, EdgeLabel, S> extends Component<ViewProps, State<NodeLabel, EdgeLabel>> {
  state: State<NodeLabel, EdgeLabel> = { open: false, rendererLoading: true }

  protected abstract newRenderer (previousProps: typeof this.props): boolean
  protected abstract makeRenderer (): Promise<R>
  protected abstract newGraphBuilder (previousProps: typeof this.props): boolean
  protected abstract makeGraphBuilder (): Promise<GraphBuilder<NodeLabel, EdgeLabel>>

  protected abstract renderPanel (): ComponentChild

  // key used to determine the layout
  protected abstract layoutKey: keyof ViewProps
  protected layoutProp (): string {
    return this.props[this.layoutKey] as string
  }

  protected doExport = (format: string, evt?: Event): void => {
    if (evt != null) evt.preventDefault()

    const { renderer } = this.state
    const { current } = this.rendererRef
    if (current === null || typeof renderer === 'undefined') return

    if (!renderer.supportedExportFormats.includes(format)) {
      console.warn('renderer does not support format (out-of-order execution?)')
      return
    }

    current.exportBlob(format)
      .then(download)
      .catch(e => {
        console.error('failed to download: ', e)
        alert('Download has failed: ' + JSON.stringify(e))
      })
  }

  private readonly handleToggle = (evt: Event): void => {
    evt.preventDefault()
    this.setState(({ open }) => ({ open: !open }))
  }

  private readonly rendererRef = createRef<Renderer<NodeLabel, EdgeLabel, S>>()

  private mounted = false
  componentDidMount (): void {
    this.mounted = true

    this.buildGraphModel()
    this.loadRenderer()
  }

  componentWillUnmount (): void {
    this.mounted = false
  }

  private lastGraph = 0
  private readonly buildGraphModel = (): void => {
    const graphID = ++this.lastGraph

    this.makeGraphBuilder().then(loader => {
      const graph = loader.build()
      this.setState(() => {
        if (!this.mounted) return null
        if (this.lastGraph !== graphID) return null
        return { graph, graphError: undefined }
      })
    }).catch(e => {
      this.setState({ graph: undefined, graphError: e.toString() })
    })
  }

  private lastRenderer = 0
  private readonly loadRenderer = (): void => {
    const rendererID = ++this.lastRenderer

    this.makeRenderer()
      .then(async (renderer) => {
        await renderer.initializeClass()
        return renderer
      })  
      .then(renderer => {
        this.setState(({ renderer: oldRenderer }) => {
          if (!this.mounted) return null
          if (this.lastRenderer !== rendererID) return null
          if (oldRenderer === renderer) return null // same renderer loaded, no need to re-render
          return { renderer, rendererLoading: false, rendererError: undefined }
        })
      }).catch((e) => {
        this.setState({ renderer: undefined, rendererLoading: false, rendererError: e.toString() })
      })
  }

  componentDidUpdate (previousProps: Readonly<ViewProps>): void {
    // builder has changed => return a new changer
    if (
      this.newGraphBuilder(previousProps) ||
      (GraphView.graphKey(previousProps) !== GraphView.graphKey(this.props))
    ) {
      this.buildGraphModel()
    }

    // renderer has changed => load the new one
    if (this.newRenderer(previousProps)) {
      this.setState({ renderer: undefined, rendererLoading: true, rendererError: undefined })
      this.loadRenderer()
    }
  }

  private static graphKey ({ pathbuilderVersion, namespaceVersion, selectionVersion, optionVersion }: ViewProps): string {
    return `${pathbuilderVersion}-${namespaceVersion}-${selectionVersion}-${optionVersion}`
  }

  render (): ComponentChild {
    const panel = this.renderPanel()
    const main = this.renderMain()

    // if we don't have a child, directly use the renderer
    if (panel === null) {
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

  private renderMain (): ComponentChild {
    const { graph, graphError, renderer, rendererLoading, rendererError } = this.state

    if (typeof graphError === 'string' || typeof rendererError === 'string') {
      return (
        <Fragment>
          {typeof graphError === 'string' && <p><b>Error loading graph: </b>{graphError}</p>}
          {typeof rendererError === 'string' && <p><b>Error loading renderer: </b>{rendererError}</p>}
        </Fragment>
      )
    }

    if (rendererLoading) {
      return <Fragment>
        <p> &nbsp; Loading ... &nbsp; </p>
      </Fragment>
    }

    if ((graph == null) || (renderer == null)) {
      return null
    }

    const { ns, id } = this.props
    let layout = this.layoutProp()

    // if we don't have a supported layout, use the default one (or the first one)
    if (typeof layout !== 'string' || !renderer.supportedLayouts.includes(layout)) {
      layout = renderer.supportedLayouts.includes(defaultLayout) ? defaultLayout : renderer.supportedLayouts[0]
    }

    return <Renderer layout={layout} key={layout} ref={this.rendererRef} renderer={renderer} graph={graph} ns={ns} id={id} />
  }

  // render the panel
}
