import { h, Ref, Fragment } from 'preact';

import ModelGraphBuilder, { ModelEdge, ModelNode } from "../../../lib/builders/model";
import GraphView from ".";
import Deduplication, { explanations, names, values } from "../../state/deduplication";
import { getModelName, models } from "../../state/renderers";

export default class ModelGraphView extends GraphView<ModelNode, ModelEdge, any> {
    protected readonly layoutKey = 'modelGraphLayout';
    protected getRenderer() {
        return this.props.modelGraphRenderer;
    }
    protected newGraphBuilder() {
        const { tree, selection, deduplication } = this.props;
        return new ModelGraphBuilder(tree, {
            include: (uri: string) => selection.includes(uri),
            deduplication,
        });
    }
    private onChangeMode = (evt: Event) => {
        this.props.setDeduplication((evt.target as HTMLInputElement).value as Deduplication)
    }
    private onChangeModelGraph = (evt: Event & { currentTarget: HTMLSelectElement}) => {
        evt.preventDefault();
        const renderer = models.get(evt.currentTarget.value);
        if (!renderer) {
            return;
        }
        this.props.setModelRenderer(renderer);
    }
    private onChangeLayout = (evt: Event) => {
        this.props.setModelLayout((evt.target as HTMLInputElement).value as string);
    }
    protected renderPanel(widthRef: Ref<HTMLInputElement>, heightRef: Ref<HTMLInputElement>) {
        const { deduplication, modelGraphRenderer, id } = this.props;
        const modelGraphName = getModelName(modelGraphRenderer);
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
                    <select value={modelGraphName} onChange={this.onChangeModelGraph}>
                        {
                            Array.from(models.keys()).map(name => <option key={name}>{name}</option>)
                        }
                    </select>
                    &nbsp;
                    Layout: &nbsp;
                    <select value={this.layoutProp()} onChange={this.onChangeLayout}>
                        {
                            modelGraphRenderer.supportedLayouts.map(name => <option key={name}>{name}</option>)
                        }
                    </select>
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

            <fieldset>
                <legend>Graph Export</legend>

                <p>
                    Click the button below to save the currently visible part of the graph as a png image.
                    Before being saved, the graph will be redrawn in the selection resolution.
                </p>
                <p>
                    <label for={`${id}-export-width`}>Width: </label>
                    <input type="number" id={`${id}-export-width`} ref={widthRef} min={100} max={10000} value={1000} />
                </p>
                <p>
                    <label for={`${id}-export-height`}>Height: </label>
                    <input type="number" id={`${id}-export-height`} ref={heightRef} min={100} max={10000} value={1000} />
                </p>

                <p>
                    <em>Some Rendering Backends may ignore the size options.</em>
                </p>

                <p>
                    <button onClick={this.doExport}>Export Graph</button>
                </p>
            </fieldset>
        </Fragment>
    }
}
