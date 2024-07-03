import { Component, type ComponentChild, Fragment } from 'preact'
import { type NamespaceMap } from '../../../lib/namespace'
import { Field, type Bundle } from '../../../lib/pathbuilder/pathtree'
import * as styles from './hierarchy.module.css'
import { classes } from '../../../lib/utils/classes'
import { type ColorPreset, colorPresets } from '../../state/state/preset'
import { type ReducerProps } from '../../state'
import { selectAll, selectNone, updateSelection } from '../../state/reducers/inspector/selection'
import { collapseAll, expandAll, collapseNode } from '../../state/reducers/inspector/collapse'
import { applyColorPreset, loadColorMap, setColor } from '../../state/reducers/inspector/color'
import DropArea from '../../../lib/components/drop-area'
import download from '../../../lib/utils/download'
import { Type } from '../../../lib/utils/media'
import { setHideEqualParentPaths } from '../../state/reducers/inspector/tree'

export default class HierarchyView extends Component<ReducerProps> {
  private readonly handleSelectAll = (evt: Event): void => {
    evt.preventDefault()
    this.props.apply(selectAll())
  }

  private readonly handleSelectNone = (evt: Event): void => {
    evt.preventDefault()
    this.props.apply(selectNone())
  }

  private readonly handleExpandAll = (evt: Event): void => {
    evt.preventDefault()
    this.props.apply(expandAll())
  }

  private readonly handleCollapseAll = (evt: Event): void => {
    evt.preventDefault()
    this.props.apply(collapseAll())
  }

  private readonly handleColorPreset = (preset: ColorPreset, evt: Event): void => {
    evt.preventDefault()
    this.props.apply(applyColorPreset(preset))
  }

  private readonly handleColorMapExport = (evt: Event): void => {
    const data = JSON.stringify(this.props.state.cm.toJSON(), null, 2)
    const blob = new Blob([data], { type: Type.JSON })
    download(blob, 'colors.json', 'json')
  }

  private readonly handleColorMapImport = (file: File): void => {
    this.props.apply(loadColorMap(file))
  }

  private readonly handleHideEqualParentPaths = (event: Event & { currentTarget: HTMLInputElement }): void => {
    event.preventDefault()
    this.props.apply(setHideEqualParentPaths(event.currentTarget.checked))
  }

  render (): ComponentChild {
    const { tree, cmLoadError, hideEqualParentPaths } = this.props.state
    return (
      <>
        <p>
          This page displays the pathbuilder  as a hierarchical structure.
          It is similar to the WissKI Interface, except read-only.
        </p>
        <p>
          <input id='hide-parent-paths' type='checkbox' checked={hideEqualParentPaths} onInput={this.handleHideEqualParentPaths} />
          <label for='hide-parent-paths'>
            Hide Paths That Are Shared With Their Parent
          </label>
        </p>
        <p>
          The checkboxes here are used to include the paths in the graph displays.
          Use the shift key to update the all child values recursively.
        </p>
        <p>
          The color boxes are used to change the color of the fields in the graph displays.
          If a single node includes multiple colors, the color of the most important item will be used.
          Parent-paths are more important than sub-paths; if two paths are of the same priority the one higher in the list of paths is used.
        </p>

        <table class={styles.table}>
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
                Color Map: &nbsp;
                {
                  colorPresets.map(preset => <Fragment key={preset}><button onClick={this.handleColorPreset.bind(this, preset)}>{preset}</button>&nbsp;</Fragment>)
                }
                &nbsp;|&nbsp;
                <button onClick={this.handleColorMapExport}>Export</button>
                <DropArea types={[Type.JSON]} onDropFile={this.handleColorMapImport} compact>Import</DropArea>
                {typeof cmLoadError === 'string' && <small>&nbsp;{cmLoadError}</small>}
              </td>
            </tr>
            <tr>
              <td colSpan={6}>
                <button onClick={this.handleCollapseAll}>Collapse All</button> &nbsp;
                <button onClick={this.handleExpandAll}>Expand All</button>
              </td>
            </tr>
            {Array.from(tree.children()).map(b => <BundleRows {...this.props} visible bundle={b} level={0} key={b.path.id} />)}
          </tbody>
        </table>
      </>
    )
  }
}

const INDENT_PER_LEVEL = 50

class BundleRows extends Component<ReducerProps & { bundle: Bundle, level: number, visible: boolean }> {
  private readonly handleClick = (evt: Event): void => {
    evt.preventDefault()

    this.props.apply(collapseNode(this.props.bundle))
  }

  private shiftHeld = false
  private readonly handleKeydown = (evt: MouseEvent): void => {
    this.shiftHeld = evt.shiftKey
  }

  private readonly handleSelectionChange = (evt: Event & { currentTarget: HTMLInputElement }): void => {
    evt.preventDefault()

    const { bundle } = this.props

    const keys = this.shiftHeld ? Array.from(bundle.walk()) : [bundle]
    const value = evt.currentTarget.checked

    this.props.apply(updateSelection(keys.map(k => [k, value])))
  }

  private readonly handleColorChange = (evt: Event & { currentTarget: HTMLInputElement }): void => {
    const { bundle } = this.props
    this.props.apply(setColor(bundle, evt.currentTarget.value))
  }

  render (): ComponentChild {
    const { bundle, level, visible, state, apply } = this.props
    const { ns, cm, selection, collapsed, hideEqualParentPaths } = state
    const props: ReducerProps = { state, apply }

    const path = bundle.path
    const expanded = !collapsed.includes(bundle)
    return (
      <>
        <tr class={!visible ? styles.hidden : ''}>
          <td>
            <input type='checkbox' checked={selection.includes(bundle)} onClick={this.handleKeydown} onInput={this.handleSelectionChange} />
            <input type='color' value={cm.get(bundle)} onInput={this.handleColorChange} />
          </td>
          <td style={{ paddingLeft: INDENT_PER_LEVEL * level }}>
            <button onClick={this.handleClick} aria-role='toggle' disabled={bundle.childCount === 0}>
              {expanded ? '∨' : '>'}
            </button>
                    &nbsp;
            {path.name}
          </td>
          <td>
            <code>{path.id}</code>
          </td>
          <td>
            <Path hideEqualParentPaths={hideEqualParentPaths} node={bundle} ns={ns} />
          </td>
          <td />
          <td>
            {path.cardinality > 0 ? path.cardinality : 'unlimited'}
          </td>
        </tr>

        {Array.from(bundle.fields()).map(field => <FieldRow {...props} visible={visible && expanded} level={level + 1} field={field} key={field.path.id} />)}
        {Array.from(bundle.bundles()).map(bundle => <BundleRows {...props} visible={visible && expanded} level={level + 1} bundle={bundle} key={bundle.path.id} />)}
      </>
    )
  }
}

class FieldRow extends Component<ReducerProps & { field: Field, level: number, visible: boolean }> {
  private readonly handleSelectionChange = (evt: Event & { currentTarget: HTMLInputElement }): void => {
    this.props.apply(updateSelection([[this.props.field, evt.currentTarget.checked]]))
  }

  private readonly handleColorChange = (evt: Event & { currentTarget: HTMLInputElement }): void => {
    const { field } = this.props
    this.props.apply(setColor(field, evt.currentTarget.value))
  }

  render (): ComponentChild {
    const { state: { ns, cm, selection, hideEqualParentPaths }, field, level, visible } = this.props

    const path = field.path
    return (
      <tr class={!visible ? styles.hidden : ''}>
        <td>
          <input type='checkbox' checked={selection.includes(field)} onInput={this.handleSelectionChange} />
          <input type='color' value={cm.get(field)} onInput={this.handleColorChange} />
        </td>
        <td style={{ paddingLeft: INDENT_PER_LEVEL * level }}>
          {path.name}
        </td>
        <td>
          <code>{path.id}</code>
        </td>
        <td>
          <Path hideEqualParentPaths={hideEqualParentPaths} node={field} ns={ns} />
        </td>
        <td>
          {path.informativeFieldType}
        </td>
        <td>
          {path.cardinality > 0 ? path.cardinality : 'unlimited'}
        </td>
      </tr>
    )
  }
}

class Path extends Component<{ hideEqualParentPaths: boolean, node: Bundle | Field, ns: NamespaceMap }> {
  render (): ComponentChild {
    const { hideEqualParentPaths, node, ns } = this.props
    const parentPathIndex = hideEqualParentPaths ? node.getOwnPathIndex() : null
    const path = node.path

    return (
      <>
        {parentPathIndex !== null && parentPathIndex > 0 && <span class={classes(styles.path, styles.path_skip)} />}
        {path.pathArray.map((p, i) => {
          if (parentPathIndex !== null && i < parentPathIndex) {
            return null
          }

          let role: Role
          if (i === 2 * path.disambiguation - 2) {
            role = 'disambiguation'
          } else if (i % 2 === 0) {
            role = 'object'
          } else {
            role = 'predicate'
          }
          return <PathElement role={role} key={`${i}-${p}`} ns={ns} uri={p} />
        })}
        {node instanceof Field && path.datatypeProperty !== '' && <PathElement role='datatype' ns={ns} uri={path.datatypeProperty} />}
      </>
    )
  }
}

type Role = 'datatype' | 'disambiguation' | 'object' | 'predicate'

class PathElement extends Component<{ uri: string, role: Role, ns: NamespaceMap }> {
  render (): ComponentChild {
    const { uri, ns, role } = this.props
    return <><span class={classes(styles.path, styles[`path_${role}`])}>{ns.apply(uri)}</span></>
  }
}
