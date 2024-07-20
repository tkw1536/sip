import { Component, type ComponentChildren, createRef, type JSX } from 'preact'
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
function ModelGraphDisplayControl(
  props: ModelDisplayControlProps,
): JSX.Element {
  return (
    <Control name='Display'>
      <p>Certain components of the graph can be toggled on or off.</p>
      <p>Changing this value will re-render the graph.</p>

      <p>
        <ComponentCheckbox
          {...props}
          value={props.display.Components.ConceptLabels}
          set={(display, ConceptLabels) => ({
            ...display,
            Components: {
              ...display.Components,
              ConceptLabels,
            },
          })}
          label='Concept Labels'
        />
      </p>
      <p>
        <ComponentCheckbox
          {...props}
          value={props.display.Components.PropertyLabels}
          set={(display, PropertyLabels) => ({
            ...display,
            Components: {
              ...display.Components,
              PropertyLabels,
            },
          })}
          label='Property Labels'
        />
      </p>
      <p>
        <ComponentCheckbox
          {...props}
          value={props.display.Components.DatatypePropertyLabels}
          set={(display, DatatypePropertyLabels) => ({
            ...display,
            Components: {
              ...display.Components,
              DatatypePropertyLabels,
            },
          })}
          label='Datatype Property Labels'
        />
      </p>
    </Control>
  )
}

interface ComponentCheckboxProps extends ModelDisplayControlProps {
  value: boolean
  set: (display: ModelDisplay, checked: boolean) => ModelDisplay
  label: string
}

const ComponentCheckbox = WithID<ComponentCheckboxProps>(
  class ComponentCheckbox extends Component<
    ComponentCheckboxProps & { id: string }
  > {
    readonly #handleInput = (
      event: Event & { currentTarget: HTMLInputElement },
    ): void => {
      event.preventDefault()
      const { checked } = event.currentTarget
      const { set, display, onUpdate } = this.props

      onUpdate(set(display, checked))
    }
    render(): ComponentChildren {
      const { value, id, label } = this.props
      return (
        <>
          <input
            type='checkbox'
            id={id}
            checked={value}
            onInput={this.#handleInput}
          ></input>
          <label for={id}>{label}</label>
        </>
      )
    }
  },
)

// spellchecker:words dedup Renderable
