import { h, Ref, Fragment } from 'preact';

import ModelGraphBuilder, { ModelEdge, ModelNode } from "../../../lib/builders/model";
import GraphView from ".";
import Deduplication, { explanations, names, values } from "../../state/deduplication";

export default class ModelGraphView extends GraphView<ModelNode, ModelEdge, any> {
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
    protected renderPanel(widthRef: Ref<HTMLInputElement>, heightRef: Ref<HTMLInputElement>) {
        const { deduplication, id } = this.props;
        return <Fragment>
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
