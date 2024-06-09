import { h, Component, createRef } from 'preact';

import { Network, Data } from "vis-network";
import { DataSet } from "vis-data";
import type { Options, Position } from "vis-network";
import styles from './index.module.css';
import clone from "../../../lib/clone";

export type Node<T extends string | number> = {
    id?: T,
    shape?: Shape,
    level?: number,
    x?: number,
    y?: number,
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
    protected abstract prepare(dataset: Dataset): void;

    /** options returns the options for the graph */
    protected options(): Options {
        return {};
    }

    async toBlob([width, height]: [number, number], type?: string, quality?: number): Promise<Blob> {
        if (!this.dataset || !this.network) return Promise.reject('no network or dataset');

        return this.dataset.drawNetworkClone(this.network, width, height)
    }

    private wrapperRef = createRef<HTMLDivElement>();
    private networkRef = createRef<HTMLDivElement>();

    private observer: ResizeObserver | null = null;
    private network: Network | null = null;
    private dataset: Dataset | null = null;

    private onResize = ([entry]: ResizeObserverEntry[]) => {
        const [width, height] = VisJSGraph.getVisibleSize(entry.target);

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
        this.destroyNetwork();
    }

    private createOrUpdateNetwork = () => {
        if (!this.network) {
            const container = this.networkRef.current;
            if (!container) return;

            this.dataset = new Dataset();
            this.prepare(this.dataset);

            const options = this.options();
            options.autoResize = false;
            this.network = new Network(container, this.dataset.toData(), options);
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

    private lastAnim: number | null = null;
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
        this.dataset = null;
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
            {size && <div ref={this.networkRef} style={{ width: size[0], height: size[1] }} className={styles.network}></div>}
        </div>
    }
}

export class Dataset {
    private nodes = new DataSet<Node<string | number>>();
    private edges = new DataSet<Edge<string | number>>();

    addNode(node: Node<string | number>): string {
        const id = this.nodes.add(node)[0] as string;
        return id;
    }
    addEdge(edge: Edge<string | number>): string {
        return this.edges.add(edge)[0] as string
    }
    toData(): Data {
        return { nodes: this.nodes, edges: this.edges } as unknown as Data;
    }

    /** drawNetworkClone draws a clone of this dataset from the given network */
    async drawNetworkClone(network: Network, width: number, height: number, type?: string, quality?: number): Promise<Blob> {
        // get the original canvas size
        const orgCanvas = (await draw(network)).canvas;

        // copy nodes, edges, positions
        const nodes = clone(this.nodes.get());
        const edges = clone(this.edges.get());
        const positions = clone(network.getPositions())

        // create a new set of nodes
        const nodeSet = new DataSet<Node<string | number>>();
        nodes.forEach(node => {
            const { x, y } = positions[node.id];
            nodeSet.add({...node, x, y})
        })
        
        // create a new set of edges
        const edgeSet = new DataSet<Edge<string>>();
        edges.forEach(edge => edgeSet.add(edge))

        // create a temporary container with the original size
        const container = document.createElement('div');
        container.style.boxSizing = 'border-box';
        container.style.width = `${orgCanvas.width}px`;
        container.style.height = `${orgCanvas.height}px`;
        document.body.append(container);

        // create a clone of the network
        const networkClone = new Network(container, { nodes: nodeSet, edges: edgeSet } as unknown as any, {
            autoResize: false,
            physics: false,
            layout: {
                randomSeed: network.getSeed(),
            },
        });

        // reset the size and fit all the nodes on it
        networkClone.setSize(`${width}px`, `${height}px`)
        networkClone.moveTo({ scale: Math.max(width / orgCanvas.width, height / orgCanvas.height) })
        networkClone.fit({ animation: false });

        // export the network as a png
        return new Promise<Blob>(async (rs, rj) => {
            const canvas = (await draw(networkClone)).canvas;
            canvas.toBlob((blob) => {
                if (!blob) {
                    rj('no blob');
                    return;
                }
                rs(blob)
            }, type, quality);
        }).finally(() => {
            networkClone.destroy()
            document.body.removeChild(container)
        })

    }
}


async function draw(network: Network): Promise<CanvasRenderingContext2D> {
    return new Promise((rs) => {
        network.once('afterDrawing', (ctx) => rs(ctx))
        network.redraw()
    })
}