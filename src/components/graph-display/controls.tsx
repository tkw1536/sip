import { type ComponentChildren, Fragment, type JSX } from 'preact'
import download from '../../lib/utils/download'

import type Driver from '../../lib/drivers/impl'
import ValueSelector from '../selector'
import { useCallback, useId } from 'preact/hooks'
import { type HTMLAttributes } from 'preact/compat'
import { type Renderable } from '../../lib/graph/builders'
import { type PanelProps } from '.'

/** Control that provides only UI components */
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

interface DriverControlProps<
  NodeLabel extends Renderable<Options, AttachmentKey>,
  EdgeLabel extends Renderable<Options, AttachmentKey>,
  Options,
  AttachmentKey extends string,
> extends PanelProps<NodeLabel, EdgeLabel, Options, AttachmentKey> {
  driverNames: string[]
  layout: string | undefined
  seed: number | null

  /** controls */
  onChangeDriver: (driver: string) => void
  onChangeLayout: (layout: string) => void
  onChangeSeed: (seed: number | null) => void
}

/**
 * A control to pick which driver to control.
 */
export function DriverControl<
  NodeLabel extends Renderable<Options, AttachmentKey>,
  EdgeLabel extends Renderable<Options, AttachmentKey>,
  Options,
  AttachmentKey extends string,
>(
  props: DriverControlProps<NodeLabel, EdgeLabel, Options, AttachmentKey>,
): JSX.Element {
  const {
    driverNames,
    layout,
    onChangeDriver,
    onChangeLayout,
    onChangeSeed,
    seed,
    controller,
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
          onClick={controller?.rerender}
          disabled={typeof controller?.instance === 'undefined'}
          id={`${id}-reset`}
        >
          Re-Render
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
                values={driverNames}
                value={controller?.instance?.driverName}
                onInput={onChangeDriver}
              />
            </td>

            <td></td>
            <td>
              <label for={`${id}-layout`}>Layout</label>:
            </td>
            <td>
              <ValueSelector
                disabled={controller === null}
                value={layout}
                values={controller?.instance?.layouts}
                onInput={onChangeLayout}
              />
            </td>
          </tr>

          <tr>
            <SeedControls
              driver={controller?.instance ?? null}
              seed={seed}
              onChangeSeed={onChangeSeed}
            />
          </tr>

          <tr>
            <SimulationControls {...props} />
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
>(
  props: PanelProps<NodeLabel, EdgeLabel, Options, AttachmentKey>,
): JSX.Element {
  const { controller } = props

  return (
    <>
      <td>Animation:</td>
      <td>
        <ActionButton
          disabled={controller?.animating !== false}
          onClick={controller?.instance?.startAnimation}
        >
          Start
        </ActionButton>
        <ActionButton
          disabled={controller?.animating !== true}
          onClick={controller?.instance?.stopAnimation}
        >
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
  driver: Driver<NodeLabel, EdgeLabel, Options, AttachmentKey> | null

  seed: number | null
  onChangeSeed: (seed: number | null) => void
}): JSX.Element {
  const { driver, seed, onChangeSeed } = props
  const id = useId()

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

export function ExportControl<
  NodeLabel extends Renderable<Options, AttachmentKey>,
  EdgeLabel extends Renderable<Options, AttachmentKey>,
  Options,
  AttachmentKey extends string,
>(
  props: PanelProps<NodeLabel, EdgeLabel, Options, AttachmentKey>,
): JSX.Element | null {
  const { controller } = props

  const handleExport = useCallback(
    (event: Event & { currentTarget: HTMLButtonElement }): void => {
      event.preventDefault()
      if (controller === null) {
        console.warn('handleExport called without mounted display')
        return
      }

      const { instance } = controller

      const { format } = event.currentTarget.dataset
      if (
        typeof format !== 'string' ||
        !instance.exportFormats.includes(format)
      ) {
        console.warn('handleExport clicked on invalid element')
        return
      }

      instance
        .export(format)
        .then(async (blob): Promise<void> => {
          download(blob, undefined, format)
        })
        .catch((e: unknown) => {
          console.error('failed to download: ', e)
          alert('Download has failed: ' + JSON.stringify(e))
        })
    },
    [controller],
  )

  // check that there are some export formats
  const exportFormats = controller?.instance?.exportFormats
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
