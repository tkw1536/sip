import { h, Component, Fragment } from 'preact';
import type { ViewProps } from "../viewer";
import { NamespaceMap } from "../../lib/namespace";
import { Bundle, Field } from "../../lib/pathtree";
import styles from "./list.module.css";

export default class ListView extends Component<ViewProps> {
    render() {
        const tree = this.props.tree;
        const ns = this.props.ns;
        return <Fragment>
            <p>
                This page displays the pathbuilder  as a hierarchical structure.
                It is similar to the WissKI Interface, except read-only.
            </p>

            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>ID</th>
                        <th>Path</th>
                        <th>Field Type</th>
                        <th>Cardinality</th>
                    </tr>
                </thead>
                <tbody>
                    {tree.mainBundles.map(b => <BundleRows visible={true} ns={ns} bundle={b} level={0} key={b.path.id} />)}
                </tbody>
            </table>
        </Fragment>
    }
}

const INDENT_PER_LEVEL = 50;

class BundleRows extends Component<{ ns: NamespaceMap, bundle: Bundle, level: number, visible: boolean }, { expanded: boolean }> {
    state = { expanded: true }

    private toggle = (evt: MouseEvent) => {
        evt.preventDefault();

        this.setState(({ expanded }) => ({ expanded: !expanded }));
    }

    render() {
        const { ns, bundle, level, visible } = this.props;
        const { expanded } = this.state;
        const path = bundle.path;
        return <Fragment>
            <tr className={!visible ? styles.hidden : ""}>
                <td style={{ paddingLeft: INDENT_PER_LEVEL * level }}>
                    <button onClick={this.toggle} aria-role="toggle" disabled={bundle.childBundles.length === 0 && bundle.childFields.size === 0}>
                        {expanded ? "∨" : ">"}
                    </button>
                    &nbsp;
                    {path.name}
                </td>
                <td>
                    <code>{path.id}</code>
                </td>
                <td>
                    {path.path_array.map((p, i) => {
                        let role: Role;
                        if (i === 2 * path.disamb - 2) {
                            role = 'disambiguation'
                        } else if (i % 2 === 0) {
                            role = 'object';
                        } else {
                            role = 'predicate';
                        }
                        return <PathElement role={role} key={p} ns={ns} uri={p} />
                    })}
                </td>
                <td>
                </td>
                <td>
                    {path.cardinality > 0 ? path.cardinality : "unlimited"}
                </td>
            </tr>

            {Array.from(bundle.childFields.entries()).map(([id, field]) => <FieldRow visible={visible && expanded} level={level + 1} ns={ns} field={field} key={id} />)}
            {bundle.childBundles.map((bundle) => <BundleRows visible={visible && expanded} level={level + 1} ns={ns} bundle={bundle} key={bundle.path.id} />)}
        </Fragment>;
    }
}

class FieldRow extends Component<{ ns: NamespaceMap, field: Field, level: number, visible: boolean }> {
    render() {
        const { ns, field, level, visible } = this.props;
        const path = field.path;
        return <tr className={!visible ? styles.hidden : ""}>
            <td style={{ paddingLeft: INDENT_PER_LEVEL * level }}>
                {path.name}
            </td>
            <td>
                <code>{path.id}</code>
            </td>
            <td>
                {path.path_array.map((p, i) => {
                    let role: Role;
                    if (i === 2 * path.disamb - 2) {
                        role = 'disambiguation'
                    } else if (i % 2 === 0) {
                        role = 'object';
                    } else {
                        role = 'predicate';
                    }
                    return <PathElement role={role} key={p} ns={ns} uri={p} />
                })}
                {path.datatype_property !== '' && <PathElement role={'datatype'} ns={ns} uri={path.datatype_property} />}
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

type Role = 'datatype' | 'disambiguation' | 'object' | 'predicate';

class PathElement extends Component<{ uri: string, role: Role, ns: NamespaceMap }> {
    render() {
        const { uri, ns, role } = this.props;
        const className = styles['path'] + ' ' + (role ? styles[`path_${role}`] : '');
        return <Fragment><span className={className}>{ns.apply(uri)}</span></Fragment>
    }
}
