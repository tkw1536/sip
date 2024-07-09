import { Component, type ComponentChildren, createRef } from 'preact'
import ModelGraphBuilder, {
  type ModelEdge,
  type ModelNode,
} from '../../../../lib/graph/builders/model'
import type Deduplication from '../../../state/state/deduplication'
import { explanations, names, values } from '../../../state/state/deduplication'
import { models } from '../../../../lib/drivers/collection'
import type Driver from '../../../../lib/drivers/impl'
import GraphDisplay, { Control, DriverControl, ExportControl } from '.'
import { type ReducerProps } from '../../../state'
import {
  setModelDeduplication,
  setModelDriver,
  setModelLayout,
} from '../../../state/reducers/inspector/model'
import { WithID } from '../../../../lib/components/wrapper'
import type Graph from '../../../../lib/graph'

export default WithID<ReducerProps>(
  class ModelGraphView extends Component<ReducerProps & { id: string }> {
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

    readonly #handleChangeModelLayout = (value: string): void => {
      this.props.apply(setModelLayout(value))
    }

    readonly #displayRef = createRef<GraphDisplay<ModelNode, ModelEdge>>()

    render(): ComponentChildren {
      const {
        modelGraphLayout,
        modelGraphDriver: modelGraphRenderer,
        pathbuilderVersion,
        selectionVersion,
        optionVersion,
        colorVersion,
        ns,
        cm,
      } = this.props.state

      return (
        <GraphDisplay
          ref={this.#displayRef}
          loader={models}
          driver={modelGraphRenderer}
          builderKey={`${pathbuilderVersion}-${selectionVersion}-${optionVersion}-${colorVersion}`}
          makeGraph={this.#builder}
          ns={ns}
          cm={cm}
          layout={modelGraphLayout}
          panel={this.#renderPanel}
        />
      )
    }

    readonly #renderPanel = (
      driver: Driver<ModelNode, ModelEdge> | null,
    ): ComponentChildren => {
      const {
        state: { modelDeduplication: deduplication, modelGraphLayout },
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

// spellchecker:words dedup Renderable
