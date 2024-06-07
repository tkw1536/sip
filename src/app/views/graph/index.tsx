import { h, Component, createRef } from 'preact';

import { Network, Data } from "vis-network";
import { DataSet } from "vis-data";
import type { Options } from "vis-network";
import styles from './index.module.css';

export type Node<T extends string | number> = {
    id?: T,
    shape?: Shape,
    level?: number,
} & CommonProps;

type Shape = 'ellipse' | 'circle' | 'database' | 'box' | 'text' | 'image' | 'circularImage' | 'diamond' | 'dot' | 'star' | 'triangle' | 'triangleDown' | 'hexagon' | 'square' | 'icon';

export type Edge<T extends string | number> = {
    from: T
    to: T
    arrows?: "to"
    id?: never // needed by dataset api
} & CommonProps;

type CommonProps = {
    label?: string;
    color?: string;
    font?: string;
}

type VisState = { size?: [number, number] };
export default abstract class VisJSGraph<T> extends Component<T, VisState> {
    state: VisState = {}

    /** prepare prepares the dataset of nodes and edges to be rendered */
    abstract prepare(dataset: Dataset): void;

    /** options returns the options for the graph */
    protected options(): Options {
        return {};
    }

    private wrapperRef = createRef<HTMLDivElement>();
    private networkRef = createRef<HTMLDivElement>();

    private observer: ResizeObserver
    private network: Network

    private onResize = ([entry]: [ResizeObserverEntry]) => {
        const [ width, height ] = VisJSGraph.getVisibleSize(entry.target);

        this.setState(({ size }) => {
            // if the previous size is identical, don't resize
            if (size && size[0] === width && size[1] === height) {
                return;
            }
            return { size: [width, height] };
        })
    }

    /* returns the size of the part of target that is visible in the view port */
    private static getVisibleSize = (target: Element) => {
        const { top, bottom, left, right }  = target.getBoundingClientRect();

        return [
            Math.max(Math.min(right, window.innerWidth) - Math.max(left, 0), 0),
            Math.max(Math.min(bottom, window.innerHeight) - Math.max(top, 0), 0)
        ];
    }

    componentDidMount(): void {
        if (!this.observer) {
            this.observer = new ResizeObserver(this.onResize);
            this.observer.observe(this.wrapperRef.current);
        }
    }

    componentWillUnmount(): void {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        this.destroyNetwork();
    }

    private createOrUpdateNetwork = () => {
        if (!this.network) {
            const container = this.networkRef.current;
            if (!container) return;

            const dataset = new Dataset();
            this.prepare(dataset);

            const options = this.options();
            options.autoResize = false;
            this.network = new Network(container, dataset.toData(), options);
        };

        const { size } = this.state;
        if (!size) return;

        const nextSize = [`${size[0]}px`, `${size[1]}px`];

        // draw on the next animation frame
        this.onAnimationFrame(() => {
            if (!this.network) return;

            this.network.setSize(nextSize[0], nextSize[1]);
            this.network.redraw();
        });
    }

    private lastAnim: number | null;
    private onAnimationFrame(callback: () => void) {
        if (this.lastAnim) { window.cancelAnimationFrame(this.lastAnim) }

        this.lastAnim = window.requestAnimationFrame(() => {
            this.lastAnim = null;
            callback();
        })
    }

    private destroyNetwork = () => {
        if (!this.network) return;

        this.network.destroy();
        this.network = null;
    }

    componentDidUpdate() {
        if (this.state.size) {
            this.createOrUpdateNetwork();
        } else {
            this.destroyNetwork();
        }
    }

    render() {
        const { size } = this.state;
        return <div ref={this.wrapperRef} className={styles.wrapper}>
            {size && <div ref={this.networkRef} style={{width: size[0], height: size[1]}} className={styles.network}></div>}
        </div>
    }
}

export class Dataset {
    private nodes = new DataSet<Node<string>>();
    private edges = new DataSet<Edge<string>>();

    addNode(node: Node<string>): string {
        const id = this.nodes.add(node)[0] as string;
        return id;
    }
    addEdge(edge: Edge<string>): string {
        return this.edges.add(edge)[0] as string
    }
    toData(): Data {
        return { nodes: this.nodes, edges: this.edges } as unknown;
    }
}
