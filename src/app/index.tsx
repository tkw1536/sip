import { h, Component, Fragment } from 'preact';
import { Pathbuilder } from '../lib/pathbuilder';
import { Viewer } from "./viewer";
import Loader from "./loader";
import styles from './index.module.css';

interface State {
    data: Pathbuilder | string | false 
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
            <main className={styles.withLinkColor}>
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
        data: false,
    }
    private onClose = () => {
        this.setState({data: false})
    }
    private doLoad = async (file: File): Promise<void> => {
        // read the source file
        const source = await file.text();

        let data: Pathbuilder | string;
        try {
            data = Pathbuilder.parse(source);
        } catch (e: any) {
            data = e.toString()
        }

        // only set the state if we're still mounted
        if (!this.mounted) return
        this.setState({data: data})
    }

    private mounted = false
    componentDidMount(): void {
        this.mounted = true
    }
    componentWillUnmount(): void {
        this.mounted = false
    }

    render() {
        const { data } = this.state;
        if (data === false) {
            return <Wrapper><Loader onLoad={this.doLoad} /></Wrapper>;
        }
        if (typeof data === 'string') {
            return <Wrapper><Loader onLoad={this.doLoad} error={data} /></Wrapper>;
        }
        return <Wrapper><Viewer data={data} onClose={this.onClose}/></Wrapper>;
    }
}

