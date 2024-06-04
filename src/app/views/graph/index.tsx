import { h, Component, createRef } from 'preact';

import { Network } from "vis-network";
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
    abstract prepare(nodes: DataSet<Node<string>>, edges: DataSet<Edge<string>>): void;

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
        const nodes = new DataSet<Node<string>>();
        const edges = new DataSet<Edge<string>>();

        this.prepare(nodes, edges);

        const container = this.ref.current!;
        const data = { nodes, edges } as unknown; 
        const options = this.options();

        this.network = new Network(container, data, options);
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
