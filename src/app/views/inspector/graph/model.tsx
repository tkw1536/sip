import { Fragment, Component, type ComponentChildren, createRef } from 'preact'
import ModelGraphBuilder, { type ModelEdge, type ModelNode } from '../../../../lib/graph/builders/model'
import type Deduplication from '../../../state/state/deduplication'
import { explanations, names, values } from '../../../state/state/deduplication'
import { models } from '../../../../lib/drivers/collection'
import type GraphBuilder from '../../../../lib/graph/builders'
import type Driver from '../../../../lib/drivers/impl'
import GraphDisplay from '.'
import ValueSelector from '../../../../lib/components/selector'
import { type ReducerProps } from '../../../state'
import { setModelDeduplication, setModelLayout, setModelDriver } from '../../../state/reducers/inspector/model'
import { WithID } from '../../../../lib/components/wrapper'

export default WithID<ReducerProps>(class ModelGraphView extends Component<ReducerProps & { id: string }> {
  private readonly builder = async (): Promise<GraphBuilder<ModelNode, ModelEdge>> => {
    const { tree, selection, modelDeduplication: deduplication } = this.props.state
    return await Promise.resolve(new ModelGraphBuilder(tree, {
      include: selection.includes.bind(selection),
      deduplication
    }))
  }

  private readonly handleChangeMode = (evt: Event): void => {
    this.props.apply(setModelDeduplication((evt.target as HTMLInputElement).value as Deduplication))
  }

  private readonly handleChangeModelLayout = (evt: Event): void => {
    this.props.apply(setModelLayout((evt.target as HTMLInputElement).value))
  }

  private readonly handleChangeModelRenderer = (value: string): void => {
    this.props.apply(setModelDriver(value))
  }

  private readonly displayRef = createRef<GraphDisplay<ModelNode, ModelEdge>>()
  private readonly handleExport = (format: string, event: Event): void => {
    const { current: display } = this.displayRef
    if (display === null) {
      console.warn('handleExport called without mounted display')
      event.preventDefault()
      return
    }
    display.export(format, event)
  }

  render (): ComponentChildren {
    const { modelGraphLayout, modelGraphDriver: modelGraphRenderer, pathbuilderVersion, selectionVersion, optionVersion, colorVersion, ns, cm } = this.props.state

    return (
      <GraphDisplay
        ref={this.displayRef}
        loader={models}
        driver={modelGraphRenderer}
        builderKey={`${pathbuilderVersion}-${selectionVersion}-${optionVersion}-${colorVersion}`}
        builder={this.builder}
        ns={ns} cm={cm}
        layout={modelGraphLayout}
        panel={this.renderPanel}
      />
    )
  }

  private readonly renderPanel = (driver: Driver<ModelNode, ModelEdge> | null): ComponentChildren => {
    const { state: { modelDeduplication: deduplication, modelGraphLayout: layout }, id } = this.props

    const modelGraphName = driver?.driverName
    const exportFormats = driver?.supportedExportFormats

    return (
      <>
        <fieldset>
          <legend>Renderer</legend>

          <p>
            The model graph can be shown using different renderers.
            Each renderer supports different layouts.
          </p>
          <p>
            Changing either value will re-render the graph.
          </p>

          <p>
            Renderer: &nbsp;
            <ValueSelector values={models.names} value={modelGraphName} onInput={this.handleChangeModelRenderer} />
            &nbsp;

            Layout: &nbsp;
            {(driver != null) &&
              <select value={layout} onInput={this.handleChangeModelLayout}>
                {
                  driver.supportedLayouts.map(name => <option key={name}>{name}</option>)
                }
              </select>}
          </p>
        </fieldset>
        <fieldset>
          <legend>Deduplication</legend>

          <p>
            Classes may occur in the pathbuilder more than once.
            Usually, each class would be shown as many times as each occurs.
            Instead, it might make sense to deduplicate nodes and only show classes fewer times.
          </p>
          <p>
            Changing this value will re-render the graph.
          </p>

          <div onInput={this.handleChangeMode}>{
            values.map(v =>
              <p key={v}>
                <input name={`${id}-dedup-mode`} id={`${id}-dedup-mode-${v}`} type='radio' checked={deduplication === v} value={v} />
                <label for={`${id}-dedup-mode-${v}`}>
                  <em>{names[v]}.</em>&nbsp;
                  {explanations[v]}
                </label>
              </p>)
          }
          </div>
        </fieldset>

        {(exportFormats != null) && exportFormats.length > 0 &&
          <fieldset>
            <legend>Graph Export</legend>

            <p>
              Click the button below to export the graph.
              Depending on the format and graph size, this might take a few seconds to generate.
            </p>
            <p>
              {exportFormats.map(format =>
                <Fragment key={format}>
                  <button onClick={this.handleExport.bind(this, format)}>{format}</button>
                  &nbsp;
                </Fragment>)}
            </p>
          </fieldset>}
      </>
    )
  }
})

// spellchecker:words dedup Renderable
