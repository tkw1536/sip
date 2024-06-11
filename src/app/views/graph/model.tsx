import { h, Ref, Fragment } from 'preact';

import ModelGraphBuilder, { Deduplication, ModelEdge, ModelNode } from "../../../lib/builders/model";
import { VisJSModelRenderer } from "./renderers/visjs";
import Graph from "../../../lib/graph";
import GraphView from ".";

export default class ModelGraphView extends GraphView<ModelNode, ModelEdge, any> {
    protected getRenderer() {
        return VisJSModelRenderer;
    }
    protected newGraphBuilder() {
        const { tree, selection, deduplication } = this.props;
        return new ModelGraphBuilder(tree, {
            include: (uri: string) => selection.includes(uri),
            deduplication,
        });
    }
    private onChangeMode = (evt: Event & { currentTarget: HTMLSelectElement }) => {
        this.props.setDeduplication(evt.currentTarget.value as Deduplication)
    }
    protected renderPanel(widthRef: Ref<HTMLInputElement>, heightRef: Ref<HTMLInputElement>) {
        const { deduplication } = this.props;
        return <Fragment>
            <h2>Model Graph Options</h2>
            <p>
                Use these options to adjust the model graph.
                You have to click apply for the options to take effect.
            </p>

            <h3>Deduplication</h3>
            <p>
                Classes may occur in the pathbuilder more than once.
                Usually, each class would be shown as many times as each occurs.
                Instead, it might make sense to deduplicate nodes and only show classes fewer times.

            </p>
            <p>
                Changing this value will re-render the graph.
            </p>
            <p>
                <select value={deduplication} onChange={this.onChangeMode}>
                    {
                        dedupValues.map(v => <option key={v} value={v}>{dedupNames[v]}</option>)
                    }
                </select>
            </p>
            <p>
                {dedupExplanations[deduplication]}
            </p>

            <h2>Export</h2>

            <p>
                Click the button below to save the currently visible part of the graph as a png image.
                Before being saved, the graph will be redrawn in the selection resolution.
            </p>

            <p>
                <input type="number" ref={widthRef} min={100} max={10000} value={1000}></input>x
                <input type="number" ref={heightRef} min={100} max={10000} value={1000}></input>
                &nbsp;
                <button onClick={this.doExport}>Export Graph</button>
            </p>
        </Fragment>
    }
}

const dedupValues = [
    Deduplication.Full,
    Deduplication.Main,
]
const dedupNames = Object.freeze({
    [Deduplication.Full]: "Full",
    [Deduplication.Main]: "Main Bundles"
})

const dedupExplanations = Object.freeze({
    [Deduplication.Full]: "Draw each class at most once. This corresponds to drawing a subset of the associated ontology with their domains and ranges. ",
    [Deduplication.Main]: "Draw each main bundle at most once. "
})