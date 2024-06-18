import { h, Component, Fragment, ComponentChild } from 'preact'
import type { ViewProps } from '../viewer'
import { NamespaceMap } from '../../lib/namespace'
import { Bundle, Field } from '../../lib/pathtree'
import styles from './list.module.css'

export default class ListView extends Component<ViewProps> {
  private readonly handleSelectAll = (evt: Event): void => {
    evt.preventDefault()
    this.props.selectAll()
  }

  private readonly handleSelectNone = (evt: Event): void => {
    evt.preventDefault()
    this.props.selectNone()
  }

  private readonly handleExpandAll = (evt: Event): void => {
    evt.preventDefault()
    this.props.expandAll()
  }

  private readonly handleCollapseAll = (evt: Event): void => {
    evt.preventDefault()
    this.props.collapseAll()
  }

  render (): ComponentChild {
    const { tree } = this.props
    return (
      <Fragment>
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
              <th />
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
                <button onClick={this.handleSelectAll}>All</button> &nbsp;
                <button onClick={this.handleSelectNone}>None</button>
              </td>
            </tr>
            <tr>
              <td colSpan={6}>
                <button onClick={this.handleCollapseAll}>Collapse All</button> &nbsp;
                <button onClick={this.handleExpandAll}>Expand All</button>
              </td>
            </tr>
            {tree.mainBundles.map(b => <BundleRows {...this.props} visible bundle={b} level={0} key={b.path().id} />)}
          </tbody>
        </table>
      </Fragment>
    )
  }
}

const INDENT_PER_LEVEL = 50

class BundleRows extends Component<ViewProps & { bundle: Bundle, level: number, visible: boolean }> {
  private readonly handleClick = (evt: Event): void => {
    evt.preventDefault()

    this.props.toggleCollapsed(this.props.bundle.path().id)
  }

  private shiftHeld = false
  private readonly handleKeydown = (evt: MouseEvent): void => {
    this.shiftHeld = evt.shiftKey
  }

  private readonly handleChange = (evt: Event & { currentTarget: HTMLInputElement }): void => {
    evt.preventDefault()

    const { bundle, updateSelection } = this.props

    const keys = this.shiftHeld ? bundle.allChildren() : [bundle.path().id]
    const value = evt.currentTarget.checked

    updateSelection(keys.map(k => [k, value]))
  }

  render (): ComponentChild {
    const { bundle, level, visible, ...props } = this.props
    const { ns, selection, collapsed } = props

    const path = bundle.path()
    const expanded = !collapsed.includes(path.id)
    return (
      <Fragment>
        <tr className={!visible ? styles.hidden : ''}>
          <td>
            <input type='checkbox' checked={selection.includes(path.id)} onClick={this.handleKeydown} onChange={this.handleChange} />
          </td>
          <td style={{ paddingLeft: INDENT_PER_LEVEL * level }}>
            <button onClick={this.handleClick} aria-role='toggle' disabled={bundle.childBundles.length === 0 && bundle.childFields.size === 0}>
              {expanded ? '∨' : '>'}
            </button>
                    &nbsp;
            {path.name}
          </td>
          <td>
            <code>{path.id}</code>
          </td>
          <td>
            {path.pathArray.map((p, i) => {
              let role: Role
              if (i === 2 * path.disambiguation - 2) {
                role = 'disambiguation'
              } else if (i % 2 === 0) {
                role = 'object'
              } else {
                role = 'predicate'
              }
              return <PathElement role={role} key={p} ns={ns} uri={p} />
            })}
          </td>
          <td />
          <td>
            {path.cardinality > 0 ? path.cardinality : 'unlimited'}
          </td>
        </tr>

        {Array.from(bundle.childFields.entries()).map(([id, field]) => <FieldRow {...props} visible={visible && expanded} level={level + 1} field={field} key={id} />)}
        {bundle.childBundles.map(bundle => <BundleRows {...props} visible={visible && expanded} level={level + 1} bundle={bundle} key={bundle.path().id} />)}
      </Fragment>
    )
  }
}

class FieldRow extends Component<ViewProps & { field: Field, level: number, visible: boolean }> {
  private readonly handleChange = (evt: Event & { currentTarget: HTMLInputElement }): void => {
    this.props.updateSelection([[this.props.field.path().id, evt.currentTarget.checked]])
  }

  render (): ComponentChild {
    const { ns, field, level, visible, selection } = this.props
    const path = field.path()
    return (
      <tr className={!visible ? styles.hidden : ''}>
        <td>
          <input type='checkbox' checked={selection.includes(path.id)} onChange={this.handleChange} />
        </td>
        <td style={{ paddingLeft: INDENT_PER_LEVEL * level }}>
          {path.name}
        </td>
        <td>
          <code>{path.id}</code>
        </td>
        <td>
          {path.pathArray.map((p, i) => {
            let role: Role
            if (i === 2 * path.disambiguation - 2) {
              role = 'disambiguation'
            } else if (i % 2 === 0) {
              role = 'object'
            } else {
              role = 'predicate'
            }
            return <PathElement role={role} key={p} ns={ns} uri={p} />
          })}
          {path.datatypeProperty !== '' && <PathElement role='datatype' ns={ns} uri={path.datatypeProperty} />}
        </td>
        <td>
          {path.getInformativeFieldType()}
        </td>
        <td>
          {path.cardinality > 0 ? path.cardinality : 'unlimited'}
        </td>
      </tr>
    )
  }
}

type Role = 'datatype' | 'disambiguation' | 'object' | 'predicate'

class PathElement extends Component<{ uri: string, role: Role, ns: NamespaceMap }> {
  render (): ComponentChild {
    const { uri, ns, role } = this.props
    const className = styles.path + ' ' + styles[`path_${role}`]
    return <Fragment><span className={className}>{ns.apply(uri)}</span></Fragment>
  }
}
