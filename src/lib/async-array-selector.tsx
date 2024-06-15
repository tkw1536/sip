import { h, Component } from 'preact';

type AsyncArraySelectorProps = {
    load: () => Promise<Array<string>>;
    value?: string;
    onChange: (value: string) => void;
};

type AsyncArraySelectorState = {
    values?: Array<string>;
}
export default class AsyncArraySelector extends Component<AsyncArraySelectorProps> {
    state: AsyncArraySelectorState = {}

    private mounted = false;
    componentDidMount(): void {
        this.mounted = true;
        this.loadOptions();
    }
    componentWillUnmount(): void {
        this.mounted = false;
    }

    componentDidUpdate(previousProps: Readonly<AsyncArraySelectorProps>, previousState: Readonly<{}>, snapshot: any): void {
        if (previousProps.load != this.props.load) {
            this.loadOptions();
        }
    }

    private lastLoadId = 0;
    private loadOptions = () => {
        const loadId = ++this.lastLoadId;

        this.props.load().then(values =>
            this.setState(() => {
                if (!this.mounted) return null;
                if (this.lastLoadId != loadId) return null;
                return { values };
            })
        ).catch(e => {
            console.warn("failed to load: ", e)
        })
    }

    private onChange = (evt: Event & {currentTarget: HTMLSelectElement }) => {
        evt.preventDefault();
        this.props.onChange(evt.currentTarget.value);
    }

    render() {
        const { value } = this.props;
        const { values } = this.state;
        if (!values || typeof value !== 'string') {
            return <select />;
        }
        return (
            <select value={this.props.value} onChange={this.onChange}>
                {
                    values.map(value => <option key={value}>{value}</option> )
                }
            </select>
        )
    }
}