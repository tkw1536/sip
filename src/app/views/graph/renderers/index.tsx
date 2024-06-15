import { Component, ComponentChild, ComponentClass, Ref, createRef, h } from 'preact';
import Graph from "../../../../lib/graph";
import { NamespaceMap } from "../../../../lib/namespace";
import styles from './index.module.css';

export type GraphRendererProps<NodeLabel, EdgeLabel> = RendererProps<NodeLabel, EdgeLabel> & Size & { layout: string };

type RendererProps<NodeLabel, EdgeLabel> = {
    layout: string;
    graph: Graph<NodeLabel, EdgeLabel>,
    ns: NamespaceMap,
    id: string, // some globally unique id
}
export abstract class GraphRenderer<NodeLabel, EdgeLabel> extends Component<GraphRendererProps<NodeLabel, EdgeLabel>> {
    /** toBlob renders a copy of the currently rendered graph into a blob */
    abstract toBlob(format: string): Promise<Blob>;
}

/** An implemented GraphRenderer class */
export interface GraphRendererClass<NodeLabel, EdgeLabel, S> extends ComponentClass<S, any> {
    new (props: GraphRendererProps<NodeLabel, EdgeLabel>, context?: any): GraphRenderer<NodeLabel, EdgeLabel>;

    readonly defaultLayout: string;
    readonly supportedLayouts: string[];
    readonly supportedExportFormats: string[];
}

type RenderProps<NodeLabel, EdgeLabel, S> = RendererProps<NodeLabel, EdgeLabel> & { renderer: GraphRendererClass<NodeLabel, EdgeLabel, S>}
type RenderState = { size?: [number, number]; };
/**
 * Renderer instantiates a renderer onto the page
 */
export class Renderer<NodeLabel, EdgeLabel, S> extends Component<RenderProps<NodeLabel, EdgeLabel, S>, RenderState> {
    state: RenderState = { }

    async exportBlob(format: string): Promise<Blob> {
        const renderer = this.rendererRef.current;
        if (!renderer) {
            return Promise.reject('no visible graph renderer');    
        }
        
        const rendererClass = renderer.constructor as GraphRendererClass<NodeLabel, EdgeLabel, S>; 
        if (rendererClass.supportedExportFormats.indexOf(format) < 0) {
            return Promise.reject('format not suppported');
        }

        return renderer.toBlob(format);
    }

    private wrapperRef = createRef<HTMLDivElement>();
    private rendererRef = createRef<GraphRenderer<NodeLabel, EdgeLabel>>();

    private observer: ResizeObserver | null = null;

    private onResize = ([entry]: ResizeObserverEntry[]) => {
        const [width, height] = Renderer.getVisibleSize(entry.target);

        this.setState(({ size }) => {
            // if the previous size is identical, don't resize
            if (size && size[0] === width && size[1] === height) {
                return null;
            }
            return { size: [width, height] };
        })
    }

    /* returns the size of the part of target that is visible in the view port */
    private static getVisibleSize = (target: Element) => {
        const { top, bottom, left, right } = target.getBoundingClientRect();

        return [
            Math.max(Math.min(right, window.innerWidth) - Math.max(left, 0), 0),
            Math.max(Math.min(bottom, window.innerHeight) - Math.max(top, 0), 0)
        ];
    }

    componentDidMount(): void {
        if (!this.observer) {
            this.observer = new ResizeObserver(this.onResize);
            this.observer.observe(this.wrapperRef.current!);
        }
    }

    componentWillUnmount(): void {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
    }
    render() {
        const { renderer: Renderer, ...props } = this.props;
        const { size } = this.state;
        return <div ref={this.wrapperRef} className={styles.wrapper}>
            {size && <Renderer  ref={this.rendererRef} {...props} width={size[0]} height={size[1]} />}
        </div>
    }
}

export type Size = { width: number; height: number; }

export abstract class LibraryBasedRenderer<NodeLabel, EdgeLabel, RendererObject, RendererSetup> extends GraphRenderer<NodeLabel, EdgeLabel> {
    private instance: { object: RendererObject, setup: RendererSetup } | null = null;

    protected abstract beginSetup(container: HTMLElement, size: Size, definitelyAcylic: boolean): RendererSetup
    protected abstract addNode(setup: RendererSetup, id: number, node: NodeLabel): RendererSetup | void;
    protected abstract addEdge(setup: RendererSetup, from: number, to: number, edge: EdgeLabel): RendererSetup | void;
    protected abstract endSetup(setup: RendererSetup, container: HTMLElement, size: Size, definitelyAcylic: boolean): RendererObject
    
    protected abstract resizeObject(object: RendererObject, setup: RendererSetup, size: Size): RendererObject | void;
    protected abstract destroyObject(object: RendererObject, setup: RendererSetup): void;

    protected abstract objectToBlob(object: RendererObject, setup: RendererSetup, format: string): Promise<Blob>

    private createRenderer() {
        const current = this.container.current;
        if (this.instance || !current) {
            return;
        }

        const { graph, width, height } = this.props;

        try {
            // begin setup
            let setup = this.beginSetup(current, {width, height}, graph.definitelyAcyclic);

            // add all nodes and edges
            graph.getNodes().forEach(([id, node]) => {
                const newSetup = this.addNode(setup, id, node);
                if (typeof newSetup === 'undefined') return;
                setup = newSetup;
            })
            graph.getEdges().forEach(([from, to, edge]) => {
                const newSetup = this.addEdge(setup, from, to, edge);
                if (typeof newSetup === 'undefined') return;
                setup = newSetup;
            })
            const object = this.endSetup(setup, current, {width, height}, graph.definitelyAcyclic);

            this.instance = {
                object: object,
                setup: setup,
            }
        } catch(e) {
            console.error("failed to render graph");
            console.error(e);
            return;
        }

        this.updateRendererSize();
    }

    private destroyRenderer() {
        if (this.instance === null) return;
        this.destroyObject(this.instance.object, this.instance.setup);
        this.instance = null;
    }

    private updateRendererSize() {
        if(!this.instance) return;
        const { width, height } = this.props;
        
        const next = this.resizeObject(this.instance.object, this.instance.setup, { width, height });
        if (typeof next === 'undefined') return;
        this.instance.object = next;
    }

    async toBlob(format: string): Promise<Blob> {
        if (!this.instance) return Promise.reject('renderer object not setup');
        
        return this.objectToBlob(this.instance.object, this.instance.setup, format);
    }

    componentDidMount(): void {
        this.createRenderer();
    }
    componentDidUpdate(previousProps: GraphRendererProps<NodeLabel, EdgeLabel>): void {
        const { width, height, graph } = this.props;

        // if we got a new graph, re-create the network!
        if (previousProps.graph != graph) {
            this.destroyRenderer();
            this.createRenderer();
            return; // automatically resized properly
        }

        if (previousProps.width === width && previousProps.height !== height) {
            return; // size didn't change => no need to do anything
        }

        this.updateRendererSize()
    }

    private container = createRef<HTMLDivElement>()
    render() {
        const { width, height } = this.props;
        return this.renderDiv({ width, height }, this.container);
    }

    protected renderDiv({ width, height }: Size, ref: Ref<HTMLDivElement>): ComponentChild {
        return <div ref={ref} style={{width, height}} />;
    }
}