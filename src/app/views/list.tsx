import { h, Component, Fragment } from 'preact';
import type { ViewProps } from "../viewer";
import { Pathbuilder, Path } from "../../lib/pathbuilder";
import { NamespaceMap } from "../../lib/namespace";

export default class ListView extends Component<ViewProps> {
    render() {
        const pb = this.props.data;
        const ns = this.props.ns;
        return <Fragment>
            <h2>Primitive List View</h2>

            <table>
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Path</th>
                        <th>Enabled</th>
                        <th>Field Type</th>
                        <th>Cardinality</th>
                    </tr>
                </thead>
                <tbody>
                    {pb.paths.map((p, i) => <PathRow key={p.id || i} path={p} ns={ns} />)}
                </tbody>
            </table>
        </Fragment>
    }
}

class PathRow extends Component<{ path: Path, ns: NamespaceMap }> {
    render() {
        const { path, ns } = this.props;
        return <tr>
            <td>
                <code>{path.name}</code>
            </td>
            <td>
                {!path.is_group ? <code>{path.path_array.map(p => <Fragment>{ns.apply(p)}<br /></Fragment>)}</code> : null }
            </td>
            <td>
                {path.enabled ? "True" : "False"}
            </td>
            <td>
                {path.field_type_informative || path.fieldtype}
            </td>
            <td>
                {path.cardinality > 0 ? path.cardinality : "unlimited"}
            </td>
        </tr>
    }
}