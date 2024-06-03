import { h, Component } from 'preact';


import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';

export type ViewProps = ViewerProps & ViewerState & ViewerCallbacks
type ViewerProps = { data: Pathbuilder }
type ViewerState = { tree: PathTree, ns: NamespaceMap, newNSKey: number }
type ViewerCallbacks = {
    deleteNS: (long: string) => void
    updateNS: (long: string, newShort: string) => void;
    addNS: (long: string, short: string) => void;
    resetNS: () => void;
}

import JSONView from "./views/json";
import XMLView from "./views/xml";
import ListView from "./views/list";
import GraphView from "./views/graph";

import { Pathbuilder } from '../lib/pathbuilder';
import { NamespaceMap } from "../lib/namespace";
import MapView from "./views/map";
import { PathTree } from "../lib/pathtree";

export class Viewer extends Component<ViewerProps & { onClose: () => void}, ViewerState> {
    state: ViewerState = this.initState(this.props.data);
    private initState(pb: Pathbuilder, previous?: ViewerState): ViewerState {
        const paths = new Set<string>();
        pb.paths.forEach(p => {
            paths.add(p.datatype_property)
            p.path_array.forEach(p => paths.add(p))
        })

        const tree = previous?.tree ?? PathTree.fromPathbuilder(pb);
        
        const ns = NamespaceMap.generate(paths)
            .add("http://www.w3.org/1999/02/22-rdf-syntax-ns#", "rdf");

        const newNSKey = (previous?.newNSKey ?? -1) + 1
        
        return { ns, newNSKey, tree }
    }

    /** deleteNS deletes a specific entry from the namespace map */
    private deleteNS = (long: string) => {
        this.setState({ ns: this.state.ns.remove(long) })
    }

    /** updateNS updates the given long with the newShort */
    private updateNS = (long: string, newShort: string) => {
        const mp = this.state.ns.toMap();
        if (!mp.has(long)) {
            return
        }

        // update and use a new map!
        mp.set(long, newShort);
        this.setState({ ns: NamespaceMap.fromMap(mp)})
    }

    private addNS = (long: string, short: string) => {
        this.setState(({ newNSKey, ns }) => {

            // if we already have the short or the long don't do anything
            if (ns.hasShort(short) || ns.hasLong(long)) {
                return;
            }

            return {
                ns: ns.add(long, short),
                newNSKey: newNSKey + 1,
            }
        })
    }

    /** resetNS resets the namespaces to default */
    private resetNS = () => {
        this.setState((state) => {
            const { ns } = this.initState(this.props.data, state);
            return { ns: ns, newNSKey: state.newNSKey + 1 };
        });
    }

    render() {
        const { onClose, ...props } = this.props
        const callbacks: ViewerCallbacks = {
            deleteNS: this.deleteNS,
            updateNS: this.updateNS,
            addNS: this.addNS,
            resetNS: this.resetNS,
        }
        const view = {...props, ...this.state, ...callbacks};
        return <Tabs>
            <TabList>
                <Tab>List</Tab>
                <Tab>Graph</Tab>
                <Tab>XML</Tab>
                <Tab>Namespace Map</Tab>
                <Tab>Close</Tab>
            </TabList>

            <TabPanel>
                <ListView {...view} />
            </TabPanel>
            <TabPanel>
                <GraphView {...view} />
            </TabPanel>
            <TabPanel>
                <XMLView {...view} />
            </TabPanel>
            <TabPanel>
                <MapView {...view} />
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

