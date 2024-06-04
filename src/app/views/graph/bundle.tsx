import { h, Component, Fragment } from 'preact';
import type { ViewProps } from "../../viewer";

import { Bundle } from "../../../lib/pathtree";

import VisJSGraph, { Size, Dataset } from ".";

export default class BundleGraphView extends Component<ViewProps> {
    render() {
        const { pathbuilderVersion, namespaceVersion, selectionVersion } = this.props;

        return <Fragment>
            <BundleGraph width="100%" height="80vh" key={`${pathbuilderVersion}-${namespaceVersion}-${selectionVersion}`} {...this.props} />;
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
    prepare(dataset: Dataset): void {
        const { selection, tree: { mainBundles } } = this.props;

        mainBundles.forEach(b => {
            this.addBundle(dataset, b, 0);
        })
    }
    private addBundle(dataset: Dataset, bundle: Bundle, level: number): boolean {
        const { selection } = this.props;

        // add the node for this bundle
        const includeSelf = selection.includes(bundle.path().id);
        if (includeSelf) {
            dataset.addNode({ id: bundle.path().id, label: "Bundle\n" + bundle.path().name, level: 2 * level });
        }

        // add all the child bundles
        bundle.childBundles.forEach(cb => {
            const includeChild = this.addBundle(dataset, cb, level + 1);
            if (!includeChild || !includeSelf) return;

            dataset.addEdge({ from: bundle.path().id, to: cb.path().id, arrows: 'to' })
        });

        // add all the child fields
        bundle.childFields.forEach(cf => {
            const includeField = selection.includes(cf.path().id);
            if (!includeField) return;

            dataset.addNode({ id: cf.path().id, label: cf.path().name, color: 'orange', level: 2 * level + 1 });
            if (!includeSelf) return;

            dataset.addEdge({ from: bundle.path().id, to: cf.path().id, arrows: 'to' });
        })

        return includeSelf
    }
}