import {
  Component,
  type ComponentChild,
  type ComponentChildren,
  Fragment,
  type JSX,
  createRef,
} from 'preact'
import download from '../../lib/utils/download'
import Kernel, { type DriverLoader } from '../../lib/drivers'
import type Graph from '../../lib/graph'

import { Operation } from '../../lib/utils/operation'
import type Driver from '../../lib/drivers/impl'
import ValueSelector from '../selector'
import ErrorDisplay from '../error'
import { useCallback, useId } from 'preact/hooks'
import { type HTMLAttributes } from 'preact/compat'
import { Panel } from '../layout/panel'
import { type Renderable } from '../../lib/graph/builders'

interface GraphProps<
  NodeLabel extends Renderable<Options, AttachmentKey>,
  EdgeLabel extends Renderable<Options, AttachmentKey>,
  Options,
  AttachmentKey extends string,
> {
  loader: DriverLoader<NodeLabel, EdgeLabel, Options, AttachmentKey>
  driver: string

  builderKey: string
  makeGraph: () => Promise<Graph<NodeLabel, EdgeLabel>>

  options: Options
  layout: string
  seed: number | null

  // TODO: Make this a component
  panel?:
    | ComponentChildren
    | ((
        driver: Driver<NodeLabel, EdgeLabel, Options, AttachmentKey> | null,
        animating: boolean | null,
      ) => ComponentChildren)
}

interface GraphState<
  NodeLabel extends Renderable<Options, AttachmentKey>,
  EdgeLabel extends Renderable<Options, AttachmentKey>,
  Options,
  AttachmentKey extends string,
> {
  open: boolean

  graph?: Graph<NodeLabel, EdgeLabel>
  graphError?: any

  driver: Driver<NodeLabel, EdgeLabel, Options, AttachmentKey> | null
  animating: boolean | null
}

export default class GraphDisplay<
  NodeLabel extends Renderable<Options, AttachmentKey>,
  EdgeLabel extends Renderable<Options, AttachmentKey>,
  Options,
  AttachmentKey extends string,
> extends Component<
  GraphProps<NodeLabel, EdgeLabel, Options, AttachmentKey>,
  GraphState<NodeLabel, EdgeLabel, Options, AttachmentKey>
> {
  state: GraphState<NodeLabel, EdgeLabel, Options, AttachmentKey> = {
    open: false,
    driver: null,
    animating: null,
  }

  protected makeRenderer(): {
    name: string
    loader: DriverLoader<NodeLabel, EdgeLabel, Options, AttachmentKey>
  } {
    return { name: this.props.driver, loader: this.props.loader }
  }

  protected newGraphBuilder(previousProps: typeof this.props): boolean {
    return this.props.builderKey !== previousProps.builderKey
  }

  protected renderPanel(): ComponentChildren {
    const { panel } = this.props
    const { driver, animating } = this.state
    if (typeof panel === 'function') {
      return panel(driver, animating)
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

  readonly remount = (): void => {
    const { current: kernel } = this.#kernelRef
    if (kernel === null) return

    kernel.remountDriver()
  }

  readonly #setOpen = (open: boolean): void => {
    this.setState({ open })
  }

  readonly #kernelRef =
    createRef<Kernel<NodeLabel, EdgeLabel, Options, AttachmentKey>>()

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
      <Panel panel={panel} open={open} setOpen={this.#setOpen}>
        {main}
      </Panel>
    )
  }

  readonly #driverRef = (
    driver: Driver<NodeLabel, EdgeLabel, Options, AttachmentKey> | null,
  ): void => {
    this.setState({ driver })
  }

  readonly #animatingRef = (animating: boolean | null): void => {
    this.setState({ animating })
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

    const { options, layout, seed } = this.props
    return (
      <Kernel
        ref={this.#kernelRef}
        graph={graph}
        options={options}
        loader={loader}
        seed={seed}
        driver={name}
        layout={layout}
        driverRef={this.#driverRef}
        animatingRef={this.#animatingRef}
      />
    )
  }
}

/**
 * A control to pick which driver to control.
 */
export function DriverControl<
  NodeLabel extends Renderable<Options, AttachmentKey>,
  EdgeLabel extends Renderable<Options, AttachmentKey>,
  Options,
  AttachmentKey extends string,
>(props: {
  driverNames: string[]
  driver: Driver<NodeLabel, EdgeLabel, Options, AttachmentKey> | null

  currentLayout?: string

  onChangeDriver: (driver: string) => void
  onChangeLayout: (layout: string) => void

  seed: number | null
  onChangeSeed: (seed: number | null) => void
  onResetDriver: () => void

  animating: boolean | null
}): JSX.Element {
  const {
    driver,
    animating,
    driverNames,
    currentLayout,
    onChangeDriver,
    onChangeLayout,
    onResetDriver,
    onChangeSeed,
    seed,
  } = props

  const id = useId()

  return (
    <Control name='Renderer'>
      <p>
        Show the graph using different renderers and layouts. Changing any value
        automatically re-renders the graph.
      </p>

      <p>
        <ActionButton
          onClick={onResetDriver}
          disabled={driver === null}
          id={`${id}-reset`}
        >
          Force Re-Render
        </ActionButton>
      </p>

      <table>
        <tbody>
          <tr>
            <td>
              <label for={`${id}-renderer`}>Renderer</label>:
            </td>
            <td>
              <ValueSelector
                id={`${id}-renderer`}
                values={driverNames}
                value={driver?.driverName}
                onInput={onChangeDriver}
              />
            </td>

            <td></td>
            <td>
              <label for={`${id}-layout`}>Layout</label>:
            </td>
            <td>
              <ValueSelector
                id={`${id}-layout`}
                disabled={driver === null}
                value={currentLayout}
                values={driver?.layouts}
                onInput={onChangeLayout}
              />
            </td>
          </tr>

          <tr>
            <SeedControls
              id={`${id}-seed`}
              driver={driver}
              seed={seed}
              onChangeSeed={onChangeSeed}
            />
          </tr>

          <tr>
            <SimulationControls animating={animating} driver={driver} />
          </tr>
        </tbody>
      </table>
    </Control>
  )
}

function SimulationControls<
  NodeLabel extends Renderable<Options, AttachmentKey>,
  EdgeLabel extends Renderable<Options, AttachmentKey>,
  Options,
  AttachmentKey extends string,
>(props: {
  driver: Driver<NodeLabel, EdgeLabel, Options, AttachmentKey> | null
  animating: boolean | null
}): JSX.Element {
  const { animating, driver } = props

  const handleStart = useCallback((): void => {
    if (animating !== false || driver === null) {
      return
    }
    driver.startAnimation()
  }, [animating, driver])

  const handleStop = useCallback((): void => {
    if (animating !== true || driver === null) {
      return
    }
    driver.stopAnimation()
  }, [driver, animating])

  return (
    <>
      <td>Animation:</td>
      <td>
        <ActionButton disabled={animating !== false} onClick={handleStart}>
          Start
        </ActionButton>
        <ActionButton disabled={animating !== true} onClick={handleStop}>
          Stop
        </ActionButton>
      </td>

      <td colSpan={3}></td>
    </>
  )
}

function SeedControls<
  NodeLabel extends Renderable<Options, AttachmentKey>,
  EdgeLabel extends Renderable<Options, AttachmentKey>,
  Options,
  AttachmentKey extends string,
>(props: {
  id: string

  driver: Driver<NodeLabel, EdgeLabel, Options, AttachmentKey> | null

  seed: number | null
  onChangeSeed: (seed: number | null) => void
}): JSX.Element {
  const { id, driver, seed, onChangeSeed } = props

  const handleChangeEnabled = useCallback(
    (event: Event & { currentTarget: HTMLInputElement }): void => {
      onChangeSeed(event.currentTarget.checked ? driver?.seed ?? 0 : null)
    },
    [onChangeSeed, driver?.seed],
  )

  const handleChangeValue = useCallback(
    (event: Event & { currentTarget: HTMLInputElement }): void => {
      event.preventDefault()
      const value = event.currentTarget.valueAsNumber
      if (isNaN(value) || value < 0) {
        return
      }
      onChangeSeed(value)
    },
    [onChangeSeed],
  )

  const enabled = seed !== null
  const value = seed ?? driver?.seed ?? undefined

  return (
    <>
      <td>
        <label for={id}>Seed</label>:
      </td>
      <td>
        <input
          type='number'
          id={id}
          value={value}
          disabled={!enabled}
          onInput={handleChangeValue}
        ></input>
      </td>
      <td>
        <input
          type='checkbox'
          checked={enabled}
          onInput={handleChangeEnabled}
        ></input>
      </td>
      <td>Set Seed</td>
      <td></td>
    </>
  )
}

interface ActionButtonProps extends HTMLAttributes<HTMLButtonElement> {
  onClick?: () => void
}
function ActionButton(props: ActionButtonProps): JSX.Element {
  const { onClick } = props
  const handleClick = useCallback(
    (event: Event) => {
      event.preventDefault()
      if (typeof onClick === 'function') {
        onClick()
      }
    },
    [onClick],
  )
  return <button {...props} onClick={handleClick} />
}

export function ExportControl<
  NodeLabel extends Renderable<Options, AttachmentKey>,
  EdgeLabel extends Renderable<Options, AttachmentKey>,
  Options,
  AttachmentKey extends string,
>(props: {
  driver: Driver<NodeLabel, EdgeLabel, Options, AttachmentKey> | null
  display: GraphDisplay<NodeLabel, EdgeLabel, Options, AttachmentKey> | null
}): JSX.Element | null {
  const { driver, display } = props

  const handleExport = useCallback(
    (event: Event & { currentTarget: HTMLButtonElement }): void => {
      event.preventDefault()
      if (driver === null || display === null) {
        console.warn('handleExport called without mounted display')
        return
      }

      const { format } = event.currentTarget.dataset
      if (typeof format !== 'string') {
        console.warn('handleExport clicked on invalid element')
        return
      }

      display.export(format)
    },
    [driver, display],
  )

  // check that there are some export formats
  const exportFormats = driver?.exportFormats
  if (typeof exportFormats === 'undefined' || exportFormats.length === 0) {
    return null
  }
  return (
    <Control name='Graph Export'>
      <p>
        Click the button below to export the graph. Depending on the format and
        graph size, this might take a few seconds to generate.
      </p>
      <p>
        {exportFormats.map(format => (
          <Fragment key={format}>
            <button onClick={handleExport} data-format={format}>
              {format}
            </button>
            &nbsp;
          </Fragment>
        ))}
      </p>
    </Control>
  )
}

export function Control(props: {
  name: string
  children?: ComponentChildren
}): JSX.Element {
  return (
    <fieldset>
      <legend>{props.name}</legend>
      {props.children}
    </fieldset>
  )
}
