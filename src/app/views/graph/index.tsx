import { h, Component, createRef, ComponentChild, Ref } from 'preact';
import type { ViewProps } from "../../viewer";
import { download } from "../../../lib/download";
import { GraphRendererClass, Renderer } from "./renderers";
import Graph from "../../../lib/graph";
import GraphBuilder from "../../../lib/builders";

import styles from './index.module.css';


type State<NodeLabel, EdgeLabel> = { open: boolean; graph?: Graph<NodeLabel, EdgeLabel> }

export default abstract class GraphView<NodeLabel, EdgeLabel, S> extends Component<ViewProps, State<NodeLabel, EdgeLabel>> {
    state: State<NodeLabel, EdgeLabel> = { open: false }

    private toggle = () => {
        this.setState(({ open }) => ({ open: !open }))
    }

    private graphRef = createRef<Renderer<NodeLabel, EdgeLabel, S>>();

    private widthRef = createRef<HTMLInputElement>();
    private heightRef = createRef<HTMLInputElement>();

    protected doExport = (evt?: Event) => {
        if (evt) evt.preventDefault();

        const { current } = this.graphRef;
        if (!current) return;

        const width = this.widthRef.current?.valueAsNumber ?? 1000;
        const height = this.heightRef.current?.valueAsNumber ?? 1000;

        current.toBlob([width, height], 'image/png', 1).then((blob) => {
            download(blob, 'model.png');
        })
    }

    protected abstract getRenderer(): GraphRendererClass<NodeLabel, EdgeLabel, S>;
    protected abstract newGraphBuilder(): GraphBuilder<NodeLabel, EdgeLabel>;
    protected abstract renderPanel(widthRef: Ref<HTMLInputElement>, heightRef: Ref<HTMLInputElement>): ComponentChild


    private buildGraph() {
        const builder = this.newGraphBuilder();
        this.setState({ graph: builder.build() });
    }

    componentDidMount(): void {
        this.buildGraph();
    }

    componentDidUpdate(previousProps: Readonly<ViewProps>): void {
        if (GraphView.graphKey(previousProps) === GraphView.graphKey(this.props)) {
            return;
        }

        this.buildGraph();
    }

    private static graphKey({ pathbuilderVersion, namespaceVersion, selectionVersion, optionVersion }: ViewProps): string {
        return `${pathbuilderVersion}-${namespaceVersion}-${selectionVersion}-${optionVersion}`;
    }

    render() {
        const panel = this.renderPanel(this.widthRef, this.heightRef);

        const { open, graph } = this.state;
        const renderer = graph && <Renderer ref={this.graphRef} renderer={this.getRenderer()} graph={graph} ns={this.props.ns} />;

        // if we don't have a child, directly use the renderer
        if (panel === null) {
            return renderer;
        }

        return <div className={styles.wrapper}>
            <div
                className={`${styles.options} ${open ? styles.optionsOpen : styles.optionsClosed}`}
                children={panel}
            />
            <button className={styles.handle} onClick={this.toggle}>
                {open ? "<<" : ">>"}
            </button>
            <div className={styles.main} children={renderer} />
        </div>
    }

    // render the panel 
}