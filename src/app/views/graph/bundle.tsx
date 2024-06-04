import { h, Component, Fragment } from 'preact';
import type { ViewProps } from "../../viewer";

import { DataSet } from "vis-data";
import { Bundle } from "../../../lib/pathtree";

import VisJSGraph, { Size, Node, Edge } from ".";

export default class BundleGraphView extends Component<ViewProps> {
    render() {
        return <Fragment>
            <BundleGraph width="100%" height="80vh" key={this.props.pathbuilderKey} {...this.props} />;
        </Fragment>
    }
}

class BundleGraph extends VisJSGraph<ViewProps & Size> {
    options() {
        return {
            layout: {
                hierarchical: {
                    direction: 'UD',
                    sortMethod: 'directed',
                    shakeTowards: 'roots',
                },
            },
            physics: {
                hierarchicalRepulsion: {
                    avoidOverlap: 10,
                },
            },
        };
    }
    prepare(nodes: DataSet<Node<string>, "id">, edges: DataSet<Edge<string>, "id">): void {
        // const root = nodes.add({ label: 'Pathbuilder\n' + this.props.filename })[0] as string;

        this.props.tree.mainBundles.forEach(b => {
            this.addBundle(nodes, edges, b, 0);
            // edges.add({ from: root, to: b.path.id, arrows: 'to' })
        })
    }
    private addBundle(nodes: DataSet<Node<string>>, edges: DataSet<Edge<string>>, bundle: Bundle, level: number) {
        // add the bundle itself
        nodes.add({ id: bundle.path.id, label: "Bundle\n" + bundle.path.name, level: 2*level });

        // add all the child bundles
        bundle.childBundles.forEach(cb => {
            this.addBundle(nodes, edges, cb, level + 1)

            edges.add({ from: bundle.path.id, to: cb.path.id, arrows: 'to' })
        });

        // add all the child fields
        bundle.childFields.forEach(cf => {
            nodes.add({ id: cf.path.id, label: cf.path.name, color: 'orange', level: 2*level + 1 });

            edges.add({ from: bundle.path.id, to: cf.path.id, arrows: 'to' })
        })
    }
}