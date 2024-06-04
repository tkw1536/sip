import { h, Component } from 'preact';


import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';

export type ViewProps = ViewerProps & ViewerState & ViewerCallbacks
type ViewerProps = {
    pathbuilder: Pathbuilder,
    filename: string,
}
type ViewerState = {
    pathbuilderVersion: number, // this number is updated every time the pathbuilder changes
    tree: PathTree, // the tree corresponding to the pathbuilder
 
    namespaceVersion: number, // this number is updated every time the namespaceMap is updated
    ns: NamespaceMap, // the current namespace map

    selectionVersion: number;
    selection: Selection, // the selection

    collapsed: Selection,
}
type ViewerCallbacks = {
    deleteNS: (long: string) => void
    updateNS: (long: string, newShort: string) => void;
    addNS: (long: string, short: string) => void;
    resetNS: () => void;

    updateSelection: (pairs: Array<[string, boolean]>) => void;
    selectAll: () => void,
    selectNone: () => void;

    toggleCollapsed: (id: string) => void; 
    collapseAll: () => void;
    expandAll: () => void;
}


import ExportView from "./views/export";
import ListView from "./views/list";
import BundleGraphView from "./views/graph/bundle";

import { Pathbuilder } from '../lib/pathbuilder';
import { NamespaceMap } from "../lib/namespace";
import MapView from "./views/map";
import { PathTree } from "../lib/pathtree";
import Selection from "../lib/selection";
import ModelGraphView from "./views/graph/model";

export class Viewer extends Component<ViewerProps & { onClose: () => void }, ViewerState> {
    state: ViewerState = this.initState(this.props.pathbuilder);
    private initState(pb: Pathbuilder, previous?: ViewerState): ViewerState {
        const paths = new Set<string>();
        pb.paths.forEach(p => {
            paths.add(p.datatype_property)
            p.path_array.forEach(p => paths.add(p))
        })

        const tree = previous?.tree ?? PathTree.fromPathbuilder(pb);

        const ns = NamespaceMap.generate(paths)
            .add("http://www.w3.org/1999/02/22-rdf-syntax-ns#", "rdf");

        const selection = Selection.all();
        const collapsed = Selection.none();

        const selectionVersion = (previous?.selectionVersion ?? -1 ) + 1
        const namespaceVersion = (previous?.namespaceVersion ?? -1) + 1
        const pathbuilderVersion = (previous?.pathbuilderVersion ?? -1) + 1

        return { namespaceVersion, ns, pathbuilderVersion, tree, selectionVersion, selection, collapsed }
    }

    private updateSelection = (pairs: Array<[string, boolean]>) => {
        this.setState(({ selection, selectionVersion }) => ({
            selection: selection.with(pairs),
            selectionVersion: selectionVersion + 1,
        }))
    }

    private selectAll = () => {
        this.setState(({ selection, selectionVersion }) => ({
            selection: Selection.all(),
            selectionVersion: selectionVersion + 1,
        }))
    }

    private selectNone = () => {
        this.setState(({ selection, selectionVersion }) => ({
            selection: Selection.none(),
            selectionVersion: selectionVersion + 1,
        })) 
    }

    /** deleteNS deletes a specific entry from the namespace map */
    private deleteNS = (long: string) => {
        this.setState(({ namespaceVersion }) => ({
            ns: this.state.ns.remove(long),
            namespaceVersion: namespaceVersion + 1,
        }))
    }

    /** updateNS updates the given long with the newShort */
    private updateNS = (long: string, newShort: string) => {
        this.setState(({ namespaceVersion }) => {
            const mp = this.state.ns.toMap();
            if (!mp.has(long)) {
                return
            }

            // update and use a new map!
            mp.set(long, newShort);

            return { ns: NamespaceMap.fromMap(mp), namespaceVersion: namespaceVersion + 1 };
        })
    }

    private addNS = (long: string, short: string) => {
        this.setState(({ namespaceVersion, ns }) => {

            // if we already have the short or the long don't do anything
            if (ns.hasShort(short) || ns.hasLong(long)) {
                return;
            }

            return {
                ns: ns.add(long, short),
                namespaceVersion: namespaceVersion + 1
            }
        })
    }

    /** resetNS resets the namespaces to default */
    private resetNS = () => {
        this.setState((state) => {
            const { ns } = this.initState(this.props.pathbuilder, state);
            return { ns: ns, namespaceVersion: state.namespaceVersion + 1 };
        });
    }

    private toggleCollapsed = (value: string) => {
        this.setState(
            ({collapsed}) => ({
                collapsed: collapsed.toggle(value),
            }),
        );
    }

    private collapseAll = () => {
        this.setState({ collapsed: Selection.all() })
    }

    private expandAll = () => {
        this.setState({ collapsed: Selection.none() })
    }

    render() {
        const { onClose, ...props } = this.props
        const callbacks: ViewerCallbacks = {
            deleteNS: this.deleteNS,
            updateNS: this.updateNS,
            addNS: this.addNS,
            resetNS: this.resetNS,
            updateSelection: this.updateSelection,
            selectAll: this.selectAll,
            selectNone: this.selectNone,
            toggleCollapsed: this.toggleCollapsed,
            collapseAll: this.collapseAll,
            expandAll: this.expandAll,
        }
        const view = { ...props, ...this.state, ...callbacks };
        return <Tabs>
            <TabList>
                <Tab>Overview</Tab>
                <Tab>Bundle Graph</Tab>
                <Tab>Namespace Map</Tab>
                <Tab>Export</Tab>
                <Tab>Close</Tab>
            </TabList>

            <TabPanel>
                <ListView {...view} />
            </TabPanel>
            <TabPanel>
                <BundleGraphView {...view} />
            </TabPanel>
            <TabPanel>
                <MapView {...view} />
            </TabPanel>
            <TabPanel>
                <ExportView {...view} />
            </TabPanel>
            <TabPanel>
                <p>
                    To close this pathbuilder click the following button.
                    You can also just close this tab.
                </p>
                <p>
                    <button onClick={onClose}>Close</button>
                </p>
            </TabPanel>
        </Tabs>;
    }
}

