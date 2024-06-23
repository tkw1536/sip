import { Fragment, ComponentChild, Component, ComponentChildren, createRef } from 'preact'
import ModelGraphBuilder, { ModelEdge, ModelNode } from '../../../lib/graph/builders/model'
import Deduplication, { explanations, names, values } from '../../state/deduplication'
import { models } from '../../../lib/drivers/collection'
import GraphBuilder from '../../../lib/graph/builders'
import { ViewProps } from '../../viewer'
import Driver from '../../../lib/drivers/impl'
import GraphDisplay from '.'

export default class ModelGraphView extends Component<ViewProps> {
  private readonly builder = async (): Promise<GraphBuilder<ModelNode, ModelEdge>> => {
    const { tree, selection, deduplication } = this.props
    return await Promise.resolve(new ModelGraphBuilder(tree, {
      include: (uri: string) => selection.includes(uri),
      deduplication
    }))
  }

  private readonly handleChangeMode = (evt: Event): void => {
    this.props.setDeduplication((evt.target as HTMLInputElement).value as Deduplication)
  }

  private readonly handleChangeLayout = (evt: Event): void => {
    this.props.setModelLayout((evt.target as HTMLInputElement).value)
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
    const { modelGraphLayout, modelGraphRenderer, pathbuilderVersion, selectionVersion, optionVersion, ns } = this.props

    return (
      <GraphDisplay
        ref={this.displayRef}
        loader={models}
        driver={modelGraphRenderer}
        builderKey={`${pathbuilderVersion}-${selectionVersion}-${optionVersion}`}
        builder={this.builder}
        ns={ns}
        layout={modelGraphLayout}
        panel={this.renderPanel}
      />
    )
  }

  private readonly renderPanel = (driver: Driver<ModelNode, ModelEdge> | null): ComponentChildren => {
    const { deduplication, id, setModelRenderer: handleChangeModelRenderer, modelGraphLayout: layout } = this.props

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
            <ValueSelector values={models.names} value={modelGraphName} onInput={handleChangeModelRenderer} />
            &nbsp;

            Layout: &nbsp;
            {(driver != null) &&
              <select value={layout} onInput={this.handleChangeLayout}>
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
}

interface AsyncArraySelectorProps {
  values: string[]
  value?: string
  onInput: (value: string) => void
}

class ValueSelector extends Component<AsyncArraySelectorProps> {
  private readonly handleChange = (evt: Event & { currentTarget: HTMLSelectElement }): void => {
    evt.preventDefault()
    this.props.onInput(evt.currentTarget.value)
  }

  render (): ComponentChild {
    const { value, values } = this.props
    if ((values == null) || typeof value !== 'string') {
      return <select />
    }
    return (
      <select value={this.props.value} onInput={this.handleChange}>
        {
          values.map(value => <option key={value}>{value}</option>)
        }
      </select>
    )
  }
}

// spellchecker:words dedup Renderable
