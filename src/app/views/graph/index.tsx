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

    // key used to determine the layout
    protected abstract layoutKey: keyof ViewProps;
    protected layoutProp(): string {
        return this.props[this.layoutKey] as string;
    }

    private toggle = () => {
        this.setState(({ open }) => ({ open: !open }))
    }

    private rendererRef = createRef<Renderer<NodeLabel, EdgeLabel, S>>();

    protected abstract getRenderer(): GraphRendererClass<NodeLabel, EdgeLabel, S>;
    protected abstract newGraphBuilder(): GraphBuilder<NodeLabel, EdgeLabel>;
    protected abstract renderPanel(): ComponentChild

    protected doExport = (format: string, evt?: Event) => {
        if (evt) evt.preventDefault();


        const { current } = this.rendererRef;
        if (!current) return;

        const clz = this.getRenderer();
        if (clz.supportedExportFormats.indexOf(format) < 0) {
            return;
        }

        current.exportBlob(format).then((blob) => {
            download(blob);
            console.log('blob ok', blob);
        }).catch(e => {
            console.error('failed to download: ', e);
            alert('Download has failed: ' + JSON.stringify(e));
        })
    }

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
        const panel = this.renderPanel();

        const { ns, id } = this.props;
        const { open, graph } = this.state;
        const layout = this.layoutProp();
        const renderer = graph && <Renderer layout={layout} key={layout} ref={this.rendererRef} renderer={this.getRenderer()} graph={graph} ns={ns} id={id} />;

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