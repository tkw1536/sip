import { h, Component, Fragment, ComponentType } from 'preact';
import { useId } from 'preact/compat';
import type { ViewProps } from "../viewer";
import styles from './map.module.css';

export default class MapView extends Component<ViewProps> {
    render() {
        const {namespaceVersion: newNSKey, ns} = this.props;
        const mp = ns.toMap();

        const rows = new Array();
        mp.forEach((short, long) => {
            rows.push(
                <MapViewRow props={this.props} long={long} short={short} key={short} />
            )
        })
        return <Fragment>
            <p>
                The Namespace Map is used to shorten URIs for display within the inspector.
                The underlying pathbuilder always contains the full URIs, and namespaces are not saved across reloads.
                <br />
                The initial version is generated automatically from all URIs found in the pathbuilder.
                You can manually adjust it here, by adding, removing or editing abbreviations.
            </p>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>
                            NS
                        </th>
                        <th>
                            URI
                        </th>
                        <th>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {...rows}
                    <AddMapRow key={newNSKey} {...this.props} />
                    <ResetNSRow {...this.props} />
                </tbody>
            </table>
        </Fragment>
    }
}

const AddMapRow = WithID<ViewProps>(class AddMapRow extends Component<ViewProps & { id: "string" }> {
    state = {short: "", long: ""}

    private onSubmit = (evt: SubmitEvent) => {
        evt.preventDefault();

        const { short, long } = this.state;
        const { addNS } = this.props;
        addNS(long, short);
    } 

    private onShortChange = (event: Event & { currentTarget: HTMLInputElement }) => {
        this.setState({ short: event.currentTarget.value })
    } 

    private onLongChange = (event: Event & { currentTarget: HTMLInputElement }) => {
        this.setState({ long: event.currentTarget.value })
    } 

    render() {
        const { id } = this.props;
        const { short, long } = this.state;
        return <tr>
            <td>
                <input type="text" value={short} onChange={this.onShortChange} />
            </td>
            <td>
                <input type="text" className={styles["wide"]} form={id} value={long} onChange={this.onLongChange} />
            </td>
            <td>
                <form id={id} onSubmit={this.onSubmit}>
                    <button>Add</button>
                </form>
            </td>
        </tr>
    }
})

class ResetNSRow extends Component<ViewProps> {
    private onSubmit = (evt: SubmitEvent) => {
        evt.preventDefault();
        this.props.resetNS();
    }
    render() {
        return <tr>
            <td></td>
            <td></td>
            <td>
                <form onSubmit={this.onSubmit}>
                    <button>Reset To Default</button>
                </form>
            </td>
        </tr>; 
    }
}

function WithID<T>(Component: ComponentType<T & { id: string }>): ComponentType<T> {
    return function (props: T) {
        return <Component {...props} id={useId()} />
    }
}


class MapViewRow extends Component<{ long: string, short: string, props: ViewProps }, { value?: string }> {
    state: { value?: string } = {}

    private onSubmit = (evt: Event) => {
        evt.preventDefault();

        const { value } = this.state;
        if (typeof value !== 'string') return; // do nothing

        const { long, props: { updateNS } } = this.props;
        updateNS(long, value);
    }

    private onChange = (event: Event & { currentTarget: HTMLInputElement }) => {
        this.setState({ value: event.currentTarget.value })
    }

    private onDelete = (event: Event) => {
        event.preventDefault()

        this.props.props.deleteNS(this.props.long);
    }

    render() {
        const { long, short, props: { deleteNS } } = this.props;
        const value = this.state.value ?? short;
        const dirty = value !== short;
        return <tr>
            <td>
                <form onSubmit={this.onSubmit}>
                    <input type="text" value={value ?? short} onChange={this.onChange} />
                </form>
            </td>
            <td>
                <code>{long}</code>
            </td>
            <td>
                <button onClick={this.onSubmit} disabled={!dirty}>
                    Apply
                </button>
                &nbsp;
                <button onClick={this.onDelete}>
                    Delete
                </button>
            </td>
        </tr>
    }
} 