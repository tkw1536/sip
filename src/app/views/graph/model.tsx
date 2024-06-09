import { h, Component, Fragment, createRef } from 'preact';
import type { ViewProps } from "../../viewer";
import { download } from "../../../lib/download";
import { Bundle, NodeLike } from "../../../lib/pathtree";

import VisJSGraph, { Dataset } from ".";

import styles from './model.module.css';
import { GraphBuilder } from "../../../lib/builder";

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

    render() {
        const { pathbuilderVersion, namespaceVersion, selectionVersion } = this.props;
        const { open } = this.state;

        return <div className={styles.wrapper}>
            <div className={`${styles.options} ${open ? styles.optionsOpen : styles.optionsClosed }`}>
                <h2>Model Graph Options</h2>
                <p>
                    Use these options to adjust the model graph.
                    You have to click apply for the options to take effect. 
                </p>
            
                <p>
                    (options will be added in a future revision of SIfP)
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
                <ModelGraph ref={this.graphRef} key={`${pathbuilderVersion}-${namespaceVersion}-${selectionVersion}`} {...this.props} />
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
        });

        const graph = builder.build();

        graph.getNodes().forEach(([key, { type, data }]) => {
            if (type === 'field') {
                dataset.addNode({ id: key, label: data.name, shape: 'box', color: 'orange' });
                return;
            }
            if (type === 'path') {
                dataset.addNode({ id: key, label: ns.apply(data)});
                return;
            }
            throw new Error('never reached');
        })

        graph.getEdges().forEach(([from, to, { type, data }]) => {
            if (type === 'field') {
                dataset.addEdge({ from, to, label: ns.apply(data.datatype_property), arrows: 'to' });;
                return;
            }
            if (type === 'path') {
                dataset.addEdge({ from, to, label: ns.apply(data), arrows: 'to'});
                return;
            }
            throw new Error('never reached')
        })
    }
}
