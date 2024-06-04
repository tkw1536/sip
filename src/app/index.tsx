import { h, Component, Fragment } from 'preact';
import { Pathbuilder } from '../lib/pathbuilder';
import { Viewer } from "./viewer";
import Loader from "./loader";
import styles from './index.module.css';

interface State {
    pathbuilder: Pathbuilder | string | false,
    filename: string, 
}

class Wrapper extends Component {
    render() {
        const { children } = this.props;
        return <Fragment>
            <header>
                <h1>
                    Supreme Inspector for Pathbuilders
                </h1>
            </header>
            <main className={`${styles.withLinkColor} ${styles.main}`}>
                {children}
            </main>
            <footer className={`${styles.withLinkColor} ${styles.footer}`}>
                &copy; Tom Wiesing 2024. All rights reserved. 
            </footer>
        </Fragment>
    }
}

export default class App extends Component<{}, State> {
    state: State = {
        pathbuilder: false,
        filename: "",
    }
    private onClose = () => {
        this.setState({pathbuilder: false, filename: ""})
    }
    private doLoad = async (file: File): Promise<void> => {
        // read the source file
        const source = await file.text();

        let data: Pathbuilder | string;
        let filename: string = ""
        try {
            data = Pathbuilder.parse(source);
            filename = file.name
        } catch (e: any) {
            data = e.toString()
        }

        // only set the state if we're still mounted
        if (!this.mounted) return
        this.setState({pathbuilder: data, filename})
    }

    private mounted = false
    componentDidMount(): void {
        this.mounted = true
    }
    componentWillUnmount(): void {
        this.mounted = false
    }

    render() {
        const { pathbuilder, filename } = this.state;
        if (pathbuilder === false) {
            return <Wrapper><Loader onLoad={this.doLoad} /></Wrapper>;
        }
        if (typeof pathbuilder === 'string') {
            return <Wrapper><Loader onLoad={this.doLoad} error={pathbuilder} /></Wrapper>;
        }
        return <Wrapper><Viewer data={pathbuilder} filename={filename} onClose={this.onClose}/></Wrapper>;
    }
}

