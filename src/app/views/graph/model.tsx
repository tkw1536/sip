import { h, Ref, Fragment, RenderableProps } from 'preact';

import ModelGraphBuilder, { ModelEdge, ModelNode } from "../../../lib/builders/model";
import GraphView from ".";
import Deduplication, { explanations, names, values } from "../../state/deduplication";
import { ModelRenderer, models } from "../../state/renderers";
import GraphBuilder from "../../../lib/builders";
import { ViewProps } from "../../viewer";
import AsyncArraySelector from "../../../lib/async-array-selector";

export default class ModelGraphView extends GraphView<ModelRenderer, ModelNode, ModelEdge, any> {
    protected readonly layoutKey = 'modelGraphLayout';
    
    protected newRenderer(previousProps: typeof this.props): boolean {
        return this.props.modelGraphRenderer != previousProps.modelGraphRenderer;
    }
    protected makeRenderer(): Promise<ModelRenderer> {
        return models.get(this.props.modelGraphRenderer);
    }
    
    protected newGraphBuilder(previousProps: RenderableProps<ViewProps, any>): boolean {
        return previousProps.modelGraphRenderer != this.props.modelGraphRenderer;
    }
    protected makeGraphBuilder(): Promise<GraphBuilder<ModelNode, ModelEdge>> {
        const { tree, selection, deduplication } = this.props;
        return Promise.resolve(new ModelGraphBuilder(tree, {
            include: (uri: string) => selection.includes(uri),
            deduplication,
        }));
    }

    private onChangeMode = (evt: Event) => {
        this.props.setDeduplication((evt.target as HTMLInputElement).value as Deduplication)
    }
    private onChangeModelGraph = (evt: Event & { currentTarget: HTMLSelectElement}) => {
        evt.preventDefault();
        this.props.setModelRenderer(evt.currentTarget.value);
    }
    private onChangeLayout = (evt: Event) => {
        this.props.setModelLayout((evt.target as HTMLInputElement).value as string);
    }
    protected renderPanel() {
        const { deduplication, id } = this.props;
        
        const { renderer } = this.state;
        const modelGraphName = renderer?.rendererName;
        const exportFormats = renderer?.supportedExportFormats;
        
        return <Fragment>
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
                    <AsyncArraySelector value={modelGraphName} onChange={this.props.setModelRenderer} load={models.names} /> 
                    &nbsp;
                    
                    Layout: &nbsp;
                    { renderer && <select value={this.layoutProp()} onChange={this.onChangeLayout}>
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

                <div onChange={this.onChangeMode}>{
                    values.map(v => (<p key={v}>
                        <input name={`${id}-dedup-mode`} id={`${id}-dedup-mode-${v}`} type="radio" checked={deduplication === v} value={v} />
                        <label for={`${id}-dedup-mode-${v}`}>
                            <em>{names[v]}.</em>&nbsp;
                            {explanations[v]}
                        </label>
                    </p>))
                }</div>
            </fieldset>

            { exportFormats && exportFormats.length > 0 && <fieldset>
                <legend>Graph Export</legend>

                <p>
                    Click the button below to export the graph. 
                    Depending on the format and graph size, this might take a few seconds to generate. 
                </p>
                <p>
                    {exportFormats.map(format => <Fragment key={format}>
                        <button onClick={this.doExport.bind(this, format)}>{format}</button>
                        &nbsp;
                    </Fragment>)}
                </p>
            </fieldset>}
        </Fragment>;
    }
}
