import { Component, type ComponentChildren, createRef } from 'preact'
import ModelGraphBuilder from '../../../lib/graph/builders/model'
import type Deduplication from '../state/state/deduplication'
import { explanations, names, values } from '../state/state/deduplication'
import { models } from '../../../lib/drivers/collection'
import type Driver from '../../../lib/drivers/impl'
import GraphDisplay, {
  Control,
  DriverControl,
  ExportControl,
} from '../../../components/graph-display'
import { type IReducerProps } from '../state'
import {
  setModelDeduplication,
  setModelDisplay,
  setModelDriver,
  setModelLayout,
} from '../state/reducers/model'
import { WithID } from '../../../components/wrapper'
import type Graph from '../../../lib/graph'
import {
  type ModelOptions,
  type ModelEdge,
  type ModelNode,
  type ModelDisplay,
} from '../../../lib/graph/builders/model/types'

export default WithID<IReducerProps>(
  class ModelGraphView extends Component<IReducerProps & { id: string }> {
    readonly #builder = async (): Promise<Graph<ModelNode, ModelEdge>> => {
      const {
        tree,
        selection,
        modelDeduplication: deduplication,
      } = this.props.state

      const builder = new ModelGraphBuilder(tree, {
        include: selection.includes.bind(selection),
        deduplication,
      })
      return await builder.build()
    }

    readonly #handleChangeMode = (evt: Event): void => {
      this.props.apply(
        setModelDeduplication(
          (evt.target as HTMLInputElement).value as Deduplication,
        ),
      )
    }

    readonly #handleChangeModelRenderer = (value: string): void => {
      this.props.apply(setModelDriver(value))
    }

    readonly #handleChangeDisplay = (display: ModelDisplay): void => {
      this.props.apply(setModelDisplay(display))
    }

    readonly #handleChangeModelLayout = (value: string): void => {
      this.props.apply(setModelLayout(value))
    }
    readonly #handleResetDriver = (): void => {
      const { current: display } = this.#displayRef
      display?.remount()
    }

    readonly #displayRef =
      createRef<GraphDisplay<ModelNode, ModelEdge, ModelOptions>>()

    render(): ComponentChildren {
      const {
        modelGraphLayout,
        modelDisplay: display,
        modelGraphDriver,
        pathbuilderVersion,
        selectionVersion,
        modelGraphOptionVersion,
        colorVersion,
        ns,
        cm,
      } = this.props.state

      const builderKey = `${pathbuilderVersion}-${selectionVersion}-${modelGraphOptionVersion}-${colorVersion}`

      return (
        <GraphDisplay
          ref={this.#displayRef}
          loader={models}
          driver={modelGraphDriver}
          builderKey={builderKey}
          makeGraph={this.#builder}
          options={{ ns, cm, display }}
          layout={modelGraphLayout}
          panel={this.#renderPanel}
        />
      )
    }

    readonly #renderPanel = (
      driver: Driver<ModelNode, ModelEdge, ModelOptions> | null,
    ): ComponentChildren => {
      const {
        state: {
          modelDeduplication: deduplication,
          modelGraphLayout,
          modelDisplay,
        },
        id,
      } = this.props

      return (
        <>
          <DriverControl
            driverNames={models.names}
            driver={driver}
            currentLayout={modelGraphLayout}
            onChangeDriver={this.#handleChangeModelRenderer}
            onChangeLayout={this.#handleChangeModelLayout}
            onResetDriver={this.#handleResetDriver}
          />
          <ModelGraphDisplayControl
            display={modelDisplay}
            onUpdate={this.#handleChangeDisplay}
          />
          <Control name='Deduplication'>
            <p>
              Classes may occur in the pathbuilder more than once. Usually, each
              class would be shown as many times as each occurs. Instead, it
              might make sense to deduplicate nodes and only show classes fewer
              times.
            </p>
            <p>Changing this value will re-render the graph.</p>

            <div onInput={this.#handleChangeMode}>
              {values.map(v => (
                <p key={v}>
                  <input
                    name={`${id}-dedup-mode`}
                    id={`${id}-dedup-mode-${v}`}
                    type='radio'
                    checked={deduplication === v}
                    value={v}
                  />
                  <label for={`${id}-dedup-mode-${v}`}>
                    <em>{names[v]}.</em>
                    &nbsp;
                    {explanations[v]}
                  </label>
                </p>
              ))}
            </div>
          </Control>
          <ExportControl driver={driver} display={this.#displayRef.current} />
        </>
      )
    }
  },
)

interface ModelDisplayControlProps {
  display: ModelDisplay
  onUpdate: (display: ModelDisplay) => void
}

const ModelGraphDisplayControl = WithID<ModelDisplayControlProps>(
  class ModelGraphDisplayControl extends Component<
    ModelDisplayControlProps & { id: string }
  > {
    readonly #handleChangePropertyLabels = (
      event: Event & { currentTarget: HTMLInputElement },
    ): void => {
      event.preventDefault()
      const { checked } = event.currentTarget
      const { display, onUpdate } = this.props

      onUpdate({
        ...display,
        Components: {
          ...display.Components,
          PropertyLabels: checked,
        },
      })
    }
    readonly #handleChangeDatatypePropertyLabels = (
      event: Event & { currentTarget: HTMLInputElement },
    ): void => {
      event.preventDefault()
      const { checked } = event.currentTarget
      const { display, onUpdate } = this.props

      onUpdate({
        ...display,
        Components: {
          ...display.Components,
          DatatypePropertyLabels: checked,
        },
      })
    }
    render(): ComponentChildren {
      const { display, id } = this.props
      return (
        <Control name='Display'>
          <p>Certain components of the graph can be toggled on or off.</p>
          <p>Changing this value will re-render the graph.</p>

          <p>
            <input
              type='checkbox'
              id={`${id}-property_labels`}
              checked={display.Components.PropertyLabels}
              onInput={this.#handleChangePropertyLabels}
            ></input>
            <label for={`${id}-property_labels`}>Property Labels</label>
          </p>
          <p>
            <input
              type='checkbox'
              id={`${id}-datatype_property_labels`}
              checked={display.Components.DatatypePropertyLabels}
              onInput={this.#handleChangeDatatypePropertyLabels}
            ></input>
            <label for={`${id}-datatype_property_labels`}>
              Datatype Property Labels
            </label>
          </p>
        </Control>
      )
    }
  },
)

// spellchecker:words dedup Renderable
