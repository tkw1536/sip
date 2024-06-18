import { h, Component, Fragment, ComponentChild } from 'preact'
import { Pathbuilder } from '../lib/pathbuilder'
import { Viewer } from './viewer'
import Loader from './loader'
import styles from './index.module.css'
import { WithID } from '../lib/components/wrapper'

interface State {
  pathbuilder: Pathbuilder | string | false
  filename: string
}

class Wrapper extends Component {
  render (): ComponentChild {
    const { children } = this.props
    return (
      <Fragment>
        <main className={`${styles.withLinkColor} ${styles.main}`}>
          {children}
        </main>
        <footer className={`${styles.withLinkColor} ${styles.footer}`}>
          &copy; Tom Wiesing 2024. All rights reserved.
        </footer>
      </Fragment>
    )
  }
}

export const App = WithID<{}>(class A extends Component<{ id: string }, State> {
  state: State = {
    pathbuilder: false,
    filename: ''
  }

  private readonly handleClose = (): void => {
    this.setState({ pathbuilder: false, filename: '' })
  }

  private readonly handleLoad = (file: File): void => {
    // read the source file
    file.text()
      .then(source => {
        // read the source file
        let data: Pathbuilder | string
        let filename: string = ''
        try {
          data = Pathbuilder.parse(source)
          filename = file.name
        } catch (e: any) {
          data = e.toString()
        }

        // only set the state if we're still mounted
        if (!this.mounted) return
        this.setState({ pathbuilder: data, filename })
      })
      .catch(err => {
        console.error('handleLoad: unknown error', err)
      })
  }

  private mounted = false
  componentDidMount (): void {
    this.mounted = true
  }

  componentWillUnmount (): void {
    this.mounted = false
  }

  render (): ComponentChild {
    const { id } = this.props
    const { pathbuilder, filename } = this.state
    if (pathbuilder === false) {
      return <Wrapper><Loader onLoad={this.handleLoad} /></Wrapper>
    }
    if (typeof pathbuilder === 'string') {
      return <Wrapper><Loader onLoad={this.handleLoad} error={pathbuilder} /></Wrapper>
    }
    return <Wrapper><Viewer id={id} pathbuilder={pathbuilder} filename={filename} onClose={this.handleClose} /></Wrapper>
  }
})
