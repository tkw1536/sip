import { h, Component, Fragment, createRef } from 'preact';
import type { ViewProps } from "../../viewer";
import { download } from "../../../lib/download";
import { Bundle, NodeLike } from "../../../lib/pathtree";

import VisJSGraph, { Dataset } from ".";

import styles from './model.module.css';
import { Deduplication, GraphBuilder } from "../../../lib/builder";

type State = { open: boolean; }

export default class ModelGraphView extends Component<ViewProps, State> {
    state: State = { open: false }

    private toggle = () => {
        this.setState(({open}) => ({open: !open}))
    }

    private graphRef = createRef<ModelGraph>();

    private doExport = (evt: MouseEvent) => {
        evt.preventDefault();

        const { current } = this.graphRef;
        if (!current) return;

        current.toBlob([this.widthRef.current!.valueAsNumber, this.heightRef.current!.valueAsNumber], 'image/png', 1).then((blob) => {
            download(blob, 'model.png');
        })
    }

    private widthRef = createRef<HTMLInputElement>();
    private heightRef = createRef<HTMLInputElement>();

    private onChangeMode = (evt: Event & { currentTarget: HTMLSelectElement }) => {
        this.props.setDeduplication(evt.currentTarget.value as Deduplication)
    }

    render() {
        const { pathbuilderVersion, namespaceVersion, selectionVersion, optionVersion, deduplication } = this.props;
        const { open } = this.state;

        return <div className={styles.wrapper}>
            <div className={`${styles.options} ${open ? styles.optionsOpen : styles.optionsClosed }`}>
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
                    <input type="number" ref={this.widthRef} min={100} max={10000} value={1000}></input>x
                    <input type="number" ref={this.heightRef} min={100} max={10000} value={1000}></input>
                    &nbsp;
                    <button onClick={this.doExport}>Export Graph</button>
                </p>
            </div>
            <button className={styles.handle} onClick={this.toggle}>
                { open ? "<<" : ">>"}
            </button>
            <div className={styles.main}>
                <ModelGraph ref={this.graphRef} key={`${pathbuilderVersion}-${namespaceVersion}-${selectionVersion}-${optionVersion}`} {...this.props} />
            </div>
        </div>
    }
}

class ModelGraph extends VisJSGraph<ViewProps> {
    protected options() {
        return {
            physics: {
                barnesHut: {
                    springConstant: 0,
                    avoidOverlap: 10,
                    damping: 0.09,
                },
            },
            edges: {
                smooth: {
                    enabled: true,
                    type: "continuous",
                    forceDirection: "none",
                    roundness: 0.6,
                },
            },
        }
    }
    protected prepare(dataset: Dataset): void {
        const { tree, selection, ns } = this.props;

        const builder = new GraphBuilder(tree, {
            include: (uri: string) => selection.includes(uri),
            deduplication: this.props.deduplication,
        });

        const graph = builder.build();

        graph.getNodes().forEach(([key, node]) => {
            if (node.type === 'field') {
                dataset.addNode({
                    id: key,
                    label: node.field.path().name,
                    
                    shape: 'box',
                    color: 'orange',
                });
                return;
            }
            if (node.type === 'class' && node.bundles.size === 0) {
                dataset.addNode({
                    id: key, 
                    label: ns.apply(node.clz),
                });
                return;
            }
            if (node.type === 'class' && node.bundles.size > 0) {
                const array_names = Array.from(node.bundles).map((bundle) => "Bundle " + bundle.path().name).join("\n\n");
                const label = ns.apply(node.clz) + "\n\n" + array_names;

                dataset.addNode({
                    id: key, 
                    label,
                });
                return;
            }
            throw new Error('never reached');
        })

        graph.getEdges().forEach(([from, to, edge]) => {
            if (edge.type === 'data') {
                dataset.addEdge({
                    from, to,
                    
                    label: ns.apply(edge.field.path().datatype_property),

                    arrows: 'to',
                });
                return;
            }
            if (edge.type === 'property') {
                dataset.addEdge({
                    from, to,

                    label: ns.apply(edge.property),
                })
                return;
            }
            throw new Error('never reached')
        })
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