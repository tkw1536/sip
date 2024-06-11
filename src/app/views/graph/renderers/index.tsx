import { Component, ComponentClass, createRef, h } from 'preact';
import Graph from "../../../../lib/graph";
import { NamespaceMap } from "../../../../lib/namespace";
import styles from './index.module.css';

export interface GraphRendererProps<NodeLabel, EdgeLabel> extends RendererProps<NodeLabel, EdgeLabel> {
    width: number, height: number,
}

type RendererProps<NodeLabel, EdgeLabel> = {
    graph: Graph<NodeLabel, EdgeLabel>,
    ns: NamespaceMap, 
}
export abstract class GraphRenderer<NodeLabel, EdgeLabel> extends Component<GraphRendererProps<NodeLabel, EdgeLabel>> {
    /** toBlob renders a copy of the currently rendered graph into a blob */
    abstract toBlob([width, height]: [number, number], type?: string, quality?: number): Promise<Blob>;
}

/** An implemented GraphRenderer class */
export interface GraphRendererClass<NodeLabel, EdgeLabel, S> extends ComponentClass<S, any> {
    new (props: GraphRendererProps<NodeLabel, EdgeLabel>, context?: any): GraphRenderer<NodeLabel, EdgeLabel>;
}

type RenderProps<NodeLabel, EdgeLabel, S> = RendererProps<NodeLabel, EdgeLabel> & { renderer: GraphRendererClass<NodeLabel, EdgeLabel, S>}
type RenderState = { size?: [number, number]; };
export class Renderer<NodeLabel, EdgeLabel, S> extends Component<RenderProps<NodeLabel, EdgeLabel, S>, RenderState> {
    state: RenderState = {}

    async toBlob(size: [number, number], type?: string, quality?: number): Promise<Blob> {
        const renderer = this.rendererRef.current;
        if (!renderer) {
            return Promise.reject('no visible graph renderer');    
        }

        return renderer.toBlob(size, type, quality);
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
            {size && <Renderer ref={this.rendererRef} {...props} width={size[0]} height={size[1]} />}
        </div>
    }
}