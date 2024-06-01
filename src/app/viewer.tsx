import { h, Component } from 'preact';


import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';

export type ViewProps = ViewerProps & ViewerState
type ViewerProps = { data: Pathbuilder }
type ViewerState = { ns: NamespaceMap } 

import JSONView from "./views/json";
import XMLView from "./views/xml";
import ListView from "./views/list";
import GraphView from "./views/graph";

import { Pathbuilder } from '../lib/pathbuilder';
import { NamespaceMap } from "../lib/namespace";
import MapView from "./views/map";

export class Viewer extends Component<ViewerProps & { onClose: () => void}, ViewerState> {
    state: ViewerState = this.initState(this.props.data);
    private initState(pb: Pathbuilder): ViewerState {
        const paths = new Set<string>();
        pb.paths.forEach(p => {
            paths.add(p.datatype_property)
            p.path_array.forEach(p => paths.add(p))
        })
        return { ns: NamespaceMap.generate(paths), }
    }

    render() {
        const { onClose, ...props } = this.props
        const view = {...props, ...this.state};
        return <Tabs>
            <TabList>
                <Tab>List</Tab>
                <Tab>Graph</Tab>
                <Tab>XML</Tab>
                <Tab>JSON</Tab>
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
                <JSONView {...view} />
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

