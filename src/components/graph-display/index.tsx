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

import * as styles from './index.module.css'
import { classes } from '../../lib/utils/classes'
import { Operation } from '../../lib/utils/operation'
import type Driver from '../../lib/drivers/impl'
import ValueSelector from '../selector'
import ErrorDisplay from '../error'
import { useCallback, useId } from 'preact/hooks'
import { type HTMLAttributes } from 'preact/compat'

interface GraphProps<NodeLabel, EdgeLabel, Options> {
  loader: DriverLoader<NodeLabel, EdgeLabel, Options>
  driver: string

  builderKey: string
  makeGraph: () => Promise<Graph<NodeLabel, EdgeLabel>>

  options: Options
  layout: string
  seed: number | null

  panel?:
    | ComponentChildren
    | ((
        driver: Driver<NodeLabel, EdgeLabel, Options> | null,
        animating: boolean | null,
      ) => ComponentChildren)
}

interface GraphState<NodeLabel, EdgeLabel, Options> {
  open: boolean

  graph?: Graph<NodeLabel, EdgeLabel>
  graphError?: any

  driver: Driver<NodeLabel, EdgeLabel, Options> | null
  animating: boolean | null
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
    animating: null,
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
          class={classes(styles.options, open ? styles.open : styles.closed)}
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
export function DriverControl<NodeLabel, EdgeLabel, Options>(props: {
  driverNames: string[]
  driver: Driver<NodeLabel, EdgeLabel, Options> | null

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

class SimulationControls<NodeLabel, EdgeLabel, Options> extends Component<{
  driver: Driver<NodeLabel, EdgeLabel, Options> | null
  animating: boolean | null
}> {
  readonly #handleStart = (): void => {
    const { animating, driver } = this.props
    if (animating !== false || driver === null) {
      return
    }
    driver.startAnimation()
  }
  readonly #handleStop = (): void => {
    const { animating, driver } = this.props
    if (animating !== true || driver === null) {
      return
    }
    driver.stopAnimation()
  }
  render(): ComponentChildren {
    const { animating } = this.props

    return (
      <>
        <td>Animation:</td>
        <td>
          <ActionButton
            disabled={animating !== false}
            onClick={this.#handleStart}
          >
            Start
          </ActionButton>
          <ActionButton
            disabled={animating !== true}
            onClick={this.#handleStop}
          >
            Stop
          </ActionButton>
        </td>

        <td colSpan={3}></td>
      </>
    )
  }
}

class SeedControls<NodeLabel, EdgeLabel, Options> extends Component<
  {
    id: string

    driver: Driver<NodeLabel, EdgeLabel, Options> | null

    seed: number | null
    onChangeSeed: (seed: number | null) => void
  },
  { enabled: boolean; value: number }
> {
  readonly #handleChangeEnabled = (
    event: Event & { currentTarget: HTMLInputElement },
  ): void => {
    this.props.onChangeSeed(
      event.currentTarget.checked ? this.props.driver?.seed ?? 0 : null,
    )
  }
  readonly #handleChangeValue = (
    event: Event & { currentTarget: HTMLInputElement },
  ): void => {
    event.preventDefault()
    const value = event.currentTarget.valueAsNumber
    if (isNaN(value) || value < 0) {
      return
    }
    this.props.onChangeSeed(value)
  }
  render(): ComponentChildren {
    const { id, driver, seed } = this.props

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
            onInput={this.#handleChangeValue}
          ></input>
        </td>
        <td>
          <input
            type='checkbox'
            checked={enabled}
            onInput={this.#handleChangeEnabled}
          ></input>
        </td>
        <td>Set Seed</td>
        <td></td>
      </>
    )
  }
}

interface ActionButtonProps extends HTMLAttributes<HTMLButtonElement> {
  onClick?: () => void
}
function ActionButton(props: ActionButtonProps): JSX.Element {
  const onClick = useCallback(
    (event: Event) => {
      event.preventDefault()
      if (typeof props.onClick === 'function') {
        props.onClick()
      }
    },
    [props.onClick],
  )
  return <button {...props} onClick={onClick} />
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
    const exportFormats = this.props.driver?.exportFormats
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
