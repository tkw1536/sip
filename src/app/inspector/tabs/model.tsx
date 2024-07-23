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
  setModelSeed,
} from '../state/reducers/model'
import { WithID } from '../../../components/wrapper'
import type Graph from '../../../lib/graph'
import {
  type ModelOptions,
  type ModelEdge,
  type ModelNode,
  type ModelDisplay,
  type ModelAttachmentKey,
} from '../../../lib/graph/builders/model/labels'

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

    readonly #handleChangeModelSeed = (seed: number | null): void => {
      this.props.apply(setModelSeed(seed))
    }
    readonly #handleResetDriver = (): void => {
      const { current: display } = this.#displayRef
      display?.remount()
    }

    readonly #displayRef =
      createRef<
        GraphDisplay<ModelNode, ModelEdge, ModelOptions, ModelAttachmentKey>
      >()

    render(): ComponentChildren {
      const {
        modelGraphLayout,
        modelDisplay: display,
        modelGraphDriver,
        modelGraphSeed,
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
          builderKey={builderKey}
          makeGraph={this.#builder}
          driver={modelGraphDriver}
          seed={modelGraphSeed}
          options={{ ns, cm, display }}
          layout={modelGraphLayout}
          panel={this.#renderPanel}
        />
      )
    }

    readonly #renderPanel = (
      driver: Driver<
        ModelNode,
        ModelEdge,
        ModelOptions,
        ModelAttachmentKey
      > | null,
      animating: boolean | null,
    ): ComponentChildren => {
      const {
        state: {
          modelDeduplication: deduplication,
          modelGraphLayout,
          modelDisplay,
          modelGraphSeed,
        },
        id,
      } = this.props

      return (
        <>
          <DriverControl
            driverNames={models.names}
            driver={driver}
            currentLayout={modelGraphLayout}
            seed={modelGraphSeed}
            onChangeDriver={this.#handleChangeModelRenderer}
            onChangeLayout={this.#handleChangeModelLayout}
            onChangeSeed={this.#handleChangeModelSeed}
            onResetDriver={this.#handleResetDriver}
            animating={animating}
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
      <p>Changing this value will re-render the graph.</p>

      <table>
        <tbody>
          <tr>
            <td>
              <ComponentCheckbox
                {...props}
                value={props.display.ComplexConceptNodes}
                set={(display, ComplexConceptNodes) => ({
                  ...display,
                  ComplexConceptNodes,
                })}
                label='Complex Concept Nodes'
              />
            </td>
            <td>
              <ComponentCheckbox
                {...props}
                value={props.display.ComplexLiteralNodes}
                set={(display, ComplexLiteralNodes) => ({
                  ...display,
                  ComplexLiteralNodes,
                })}
                label='Complex Literal Nodes'
              />
            </td>
          </tr>
          <tr>
            <td colSpan={2}>
              Disabling these will render appropriate bundle and field labels
              directly at the respective nodes.
            </td>
          </tr>

          <tr>
            <td colSpan={2}>
              <br />
            </td>
          </tr>

          <tr>
            <td>
              <ComponentCheckbox
                {...props}
                value={props.display.Labels.Property}
                set={(display, PropertyLabels) => ({
                  ...display,
                  Labels: {
                    ...display.Labels,
                    Property: PropertyLabels,
                  },
                })}
                label='Property Labels'
              />
              <br />
              <ComponentCheckbox
                {...props}
                value={props.display.Labels.ConceptField}
                set={(display, ConceptFieldLabels) => ({
                  ...display,
                  Labels: {
                    ...display.Labels,
                    ConceptField: ConceptFieldLabels,
                  },
                })}
                label='Field Labels'
              />
              <br />
              <ComponentCheckbox
                {...props}
                value={props.display.Labels.ConceptFieldType}
                set={(display, ConceptFieldTypes) => ({
                  ...display,
                  Labels: {
                    ...display.Labels,
                    ConceptFieldType: ConceptFieldTypes,
                  },
                })}
                label='Field Types'
              />
            </td>

            <td>
              <ComponentCheckbox
                {...props}
                value={props.display.Labels.DatatypeProperty}
                set={(display, DatatypePropertyLabels) => ({
                  ...display,
                  Labels: {
                    ...display.Labels,
                    DatatypeProperty: DatatypePropertyLabels,
                  },
                })}
                label='Datatype Property Labels'
              />
              <br />
              <ComponentCheckbox
                {...props}
                value={props.display.Labels.DatatypeField}
                set={(display, DatatypeFieldLabels) => ({
                  ...display,
                  Labels: {
                    ...display.Labels,
                    DatatypeField: DatatypeFieldLabels,
                  },
                })}
                label='Datatype Field Labels'
              />
              <br />
              <ComponentCheckbox
                {...props}
                value={props.display.Labels.DatatypeFieldType}
                set={(display, DatatypeFieldTypes) => ({
                  ...display,
                  Labels: {
                    ...display.Labels,
                    DatatypeFieldType: DatatypeFieldTypes,
                  },
                })}
                label='Datatype Field Types'
              />
            </td>
          </tr>

          <tr>
            <td colSpan={2}>
              <br />
            </td>
          </tr>

          <tr>
            <td colSpan={2}>
              <ComponentCheckbox
                {...props}
                value={props.display.Labels.Concept}
                set={(display, ConceptLabels) => ({
                  ...display,
                  Labels: {
                    ...display.Labels,
                    Concept: ConceptLabels,
                  },
                })}
                label='Concept Labels'
              />
              <br />
              <ComponentCheckbox
                {...props}
                value={props.display.Labels.Bundle}
                set={(display, BundleLabels) => ({
                  ...display,
                  Labels: {
                    ...display.Labels,
                    Bundle: BundleLabels,
                  },
                })}
                label='Bundle Labels'
              />
            </td>
          </tr>
        </tbody>
      </table>
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
          <label for={id}>
            <em>{label}</em>
          </label>
        </>
      )
    }
  },
)

// spellchecker:words dedup Renderable
