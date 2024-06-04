import { h, Component, createRef } from 'preact';

import { Network, Data } from "vis-network";
import { DataSet } from "vis-data";
import type { Options } from "vis-network";

export type Node<T extends string | number> = {
    id?: T,
    shape?: string,
    level?: number,
} & CommonProps;

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

export type Size = {
    height: number | string;
    width: number | string;
}

export default abstract class VisJSGraph<T extends Size> extends Component<T> {

    /** prepare prepares the dataset of nodes and edges to be rendered */
    abstract prepare(dataset: Dataset): void;

    /** options returns the options for the graph */
    protected options(): Options {
        return {};
        /*return {
            autoResize: true,
            layout: {
                hierarchical: {
                    enabled: true,
                }
            },
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
        }*/
    }


    private ref = createRef<HTMLDivElement>();
    private network: Network
    componentDidMount(): void {
        const dataset = new Dataset();
        this.prepare(dataset);

        const container = this.ref.current!;
        const options = this.options();

        this.network = new Network(container, dataset.toData(), options);
    }

    componentWillUnmount(): void {
        if (!this.network) {
            return
        }
        this.network.destroy();
    }

    render() {
        return <div style={{ width: this.props.width, height: this.props.height }} ref={this.ref}></div>
    }
}

export class Dataset {
    private nodes = new DataSet<Node<string>>();
    private edges = new DataSet<Edge<string>>();

    addNode(node: Node<string>): string {
        return this.nodes.add(node)[0] as string;
    }
    addEdge(edge: Edge<string>): string {
        return this.edges.add(edge)[0] as string
    }
    toData(): Data {
        return { nodes: this.nodes, edges: this.edges } as unknown;
    }
}