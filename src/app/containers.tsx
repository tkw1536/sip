import { Component, ComponentChildren } from 'preact'
import * as styles from './containers.module.css'

export class Narrow extends Component {
  render (): ComponentChildren {
    return <div class={styles.narrow}>{this.props.children}</div>
  }
}

export class Wide extends Component<{ fillParent?: boolean }> {
  render (): ComponentChildren {
    return <>{this.props.children}</>
  }
}
