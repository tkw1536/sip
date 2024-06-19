import { h, Fragment, RenderableProps, ComponentChild } from 'preact'

import ModelGraphBuilder, { ModelEdge, ModelNode } from '../../../lib/builders/model'
import GraphView from '.'
import Deduplication, { explanations, names, values } from '../../state/deduplication'
import { ModelRenderer, models } from '../../state/renderers'
import GraphBuilder from '../../../lib/builders'
import { ViewProps } from '../../viewer'
import AsyncArraySelector from '../../../lib/async-array-selector'

export default class ModelGraphView extends GraphView<ModelRenderer, ModelNode, ModelEdge, any> {
  protected readonly layoutKey = 'modelGraphLayout'

  protected newRenderer (previousProps: typeof this.props): boolean {
    return this.props.modelGraphRenderer !== previousProps.modelGraphRenderer
  }

  protected async makeRenderer (): Promise<ModelRenderer> {
    return await models.get(this.props.modelGraphRenderer)
  }

  protected newGraphBuilder (previousProps: RenderableProps<ViewProps, any>): boolean {
    return previousProps.modelGraphRenderer !== this.props.modelGraphRenderer
  }

  protected async makeGraphBuilder (): Promise<GraphBuilder<ModelNode, ModelEdge>> {
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

  protected renderPanel (): ComponentChild {
    const { deduplication, id, setModelRenderer: handleChangeModelRenderer } = this.props

    const { renderer } = this.state
    const modelGraphName = renderer?.rendererName
    const exportFormats = renderer?.supportedExportFormats

    return (
      <Fragment>
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
            <AsyncArraySelector value={modelGraphName} onInput={handleChangeModelRenderer} load={models.names} />
            &nbsp;

            Layout: &nbsp;
            {(renderer != null) &&
              <select value={this.layoutProp()} onInput={this.handleChangeLayout}>
                {
                  renderer.supportedLayouts.map(name => <option key={name}>{name}</option>)
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
                  <button onClick={this.doExport.bind(this, format)}>{format}</button>
                  &nbsp;
                </Fragment>)}
            </p>
          </fieldset>}
      </Fragment>
    )
  }
}

// spellchecker:words dedup Renderable
