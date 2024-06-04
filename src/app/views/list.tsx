import { h, Component, Fragment } from 'preact';
import type { ViewProps } from "../viewer";
import { NamespaceMap } from "../../lib/namespace";
import { Bundle, Field } from "../../lib/pathtree";
import styles from "./list.module.css";

export default class ListView extends Component<ViewProps> {
    private selectAll = (evt: Event) => {
        evt.preventDefault();
        this.props.selectAll();
    }

    private selectNone = (evt: Event) => {
        evt.preventDefault();
        this.props.selectNone();
    }

    render() {
        const { tree } = this.props;
        return <Fragment>
            <p>
                This page displays the pathbuilder  as a hierarchical structure.
                It is similar to the WissKI Interface, except read-only.

               
            </p>
            <p>
                The checkboxes here are used to include the bundle in the graph displays.
                Use the shift key to update the all child values recursively.
            </p>

            <table className={styles.table}>
                <thead>
                    <tr>
                        <th></th>
                        <th>Title</th>
                        <th>ID</th>
                        <th>Path</th>
                        <th>Field Type</th>
                        <th>Cardinality</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td colSpan={6}>
                            Select: &nbsp;
                            <button onClick={this.selectAll}>All</button> &nbsp;
                            <button onClick={this.selectNone}>None</button>
                        </td>
                    </tr>
                    {tree.mainBundles.map(b => <BundleRows {...this.props} visible={true} bundle={b} level={0} key={b.path().id} />)}
                </tbody>
            </table>
        </Fragment>
    }
}

const INDENT_PER_LEVEL = 50;

class BundleRows extends Component<ViewProps & { bundle: Bundle, level: number, visible: boolean }, { expanded: boolean }> {
    state = { expanded: true }

    private toggleExpanded = (evt: MouseEvent) => {
        evt.preventDefault();

        this.setState(({ expanded }) => ({ expanded: !expanded }));
    }

    private shiftHeld = false;
    private storeShift = (evt: MouseEvent) => {
        this.shiftHeld = evt.shiftKey;
    }

    private updateSelection = (evt: Event & { currentTarget: HTMLInputElement }) => {
        evt.preventDefault();

        const { bundle, updateSelection } = this.props;

        const keys = this.shiftHeld ? bundle.allChildren() : [bundle.path().id];
        const value = evt.currentTarget.checked;

        updateSelection(keys.map(k => [k, value]));
    }

    render() {
        const { bundle, level, visible, ...props } = this.props; 
        const { ns, selection } = props;
        const { expanded } = this.state;
        const path = bundle.path();
        return <Fragment>
            <tr className={!visible ? styles.hidden : ""}>
                <td>
                    <input type="checkbox" checked={selection.includes(path.id)} onClick={this.storeShift} onChange={this.updateSelection}></input>
                </td>
                <td style={{ paddingLeft: INDENT_PER_LEVEL * level }}>
                    <button onClick={this.toggleExpanded} aria-role="toggle" disabled={bundle.childBundles.length === 0 && bundle.childFields.size === 0}>
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

            {Array.from(bundle.childFields.entries()).map(([id, field]) => <FieldRow {...props} visible={visible && expanded} level={level + 1} field={field} key={id} />)}
            {bundle.childBundles.map(bundle => <BundleRows {...props} visible={visible && expanded} level={level + 1} bundle={bundle} key={bundle.path().id} />)}
        </Fragment>;
    }
}

class FieldRow extends Component<ViewProps & {field: Field, level: number, visible: boolean }> {
    private updateSelection = (evt: Event & { currentTarget: HTMLInputElement }) => {
        this.props.updateSelection([[this.props.field.path().id, evt.currentTarget.checked]])
    }
    render() {
        const { ns, field, level, visible, selection } = this.props;
        const path = field.path();
        return <tr className={!visible ? styles.hidden : ""}>
            <td>
                <input type="checkbox" checked={selection.includes(path.id)} onChange={this.updateSelection}></input>
            </td>
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
