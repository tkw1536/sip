import {
  Component,
  type ComponentChild,
  type ComponentChildren,
  Fragment,
  type JSX,
} from 'preact'
import { type NamespaceMap } from '../../../lib/pathbuilder/namespace'
import {
  Bundle,
  Field,
  type PathElement as PathElementT,
} from '../../../lib/pathbuilder/pathtree'
import * as styles from './tree.module.css'
import { classes } from '../../../lib/utils/classes'
import { type ColorPreset, colorPresets } from '../state/state/preset'
import { type IReducerProps } from '../state'
import {
  selectAll,
  selectNone,
  selectPredicate,
  updateSelection,
} from '../state/reducers/selection'
import {
  collapseAll,
  collapseNode,
  expandAll,
} from '../state/reducers/collapse'
import {
  applyColorPreset,
  loadColorMap,
  setColor,
} from '../state/reducers/color'
import DropArea from '../../../components/drop-area'
import download from '../../../lib/utils/download'
import { Type } from '../../../lib/utils/media'
import { setHideEqualParentPaths } from '../state/reducers/tree'
import { Panel } from '../../../components/layout/panel'

export default class TreeTab extends Component<IReducerProps> {
  readonly #handleSelectAll = (evt: Event): void => {
    evt.preventDefault()
    this.props.apply(selectAll())
  }

  readonly #handleSelectNone = (evt: Event): void => {
    evt.preventDefault()
    this.props.apply(selectNone())
  }

  readonly #handleSelectOnlyBundles = (evt: Event): void => {
    evt.preventDefault()
    this.props.apply(selectPredicate(x => x instanceof Bundle))
  }

  readonly #handleSelectOnlyFields = (evt: Event): void => {
    evt.preventDefault()
    this.props.apply(selectPredicate(x => x instanceof Field))
  }

  readonly #handleExpandAll = (evt: Event): void => {
    evt.preventDefault()
    this.props.apply(expandAll())
  }

  readonly #handleCollapseAll = (evt: Event): void => {
    evt.preventDefault()
    this.props.apply(collapseAll())
  }

  readonly #handleColorPreset = (preset: ColorPreset, evt: Event): void => {
    evt.preventDefault()
    this.props.apply(applyColorPreset(preset))
  }

  readonly #handleColorMapExport = (evt: Event): void => {
    const data = JSON.stringify(this.props.state.cm.toJSON(), null, 2)
    const blob = new Blob([data], { type: Type.JSON })
    download(blob, 'colors.json', 'json')
  }

  readonly #handleColorMapImport = (file: File): void => {
    this.props.apply(loadColorMap(file))
  }

  readonly #handleHideEqualParentPaths = (
    event: Event & { currentTarget: HTMLInputElement },
  ): void => {
    event.preventDefault()
    this.props.apply(setHideEqualParentPaths(event.currentTarget.checked))
  }

  render(): ComponentChild {
    const { tree } = this.props.state
    return (
      <Panel panel={this.#renderPanel()} margin={5}>
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
            {Array.from(tree.children()).map(b => (
              <BundleRows
                {...this.props}
                visible
                bundle={b}
                level={0}
                key={b.path.id}
              />
            ))}
          </tbody>
        </table>
      </Panel>
    )
  }

  #renderPanel(): ComponentChildren {
    const { hideEqualParentPaths, cmLoadError } = this.props.state
    return (
      <>
        <fieldset>
          <legend>Overview</legend>
          <p>
            This page displays the pathbuilder as a hierarchical structure. It
            is similar to the WissKI Interface, except read-only.
          </p>

          <p>
            <button onClick={this.#handleCollapseAll}>Collapse All</button>
            {` `}
            <button onClick={this.#handleExpandAll}>Expand All</button>
          </p>

          <p>
            <span class={classes(styles.display_path, styles.path_concept)}>
              Concept
            </span>
            <span
              class={classes(
                styles.display_path,
                styles.path_concept,
                styles.path_shared,
              )}
            >
              Concept (shared with parent)
            </span>
            <span
              class={classes(
                styles.display_path,
                styles.path_concept,
                styles.path_disambiguation,
              )}
            >
              Disambiguated Concept
            </span>
            <span class={classes(styles.display_path, styles.path_predicate)}>
              Predicate
            </span>
            <span
              class={classes(
                styles.display_path,
                styles.path_shared,
                styles.path_predicate,
              )}
            >
              Predicate (shared with parent)
            </span>
            <span class={classes(styles.display_path, styles.path_datatype)}>
              Datatype Property
            </span>
          </p>
          <p>
            <input
              id='hide-parent-paths'
              type='checkbox'
              checked={hideEqualParentPaths}
              onInput={this.#handleHideEqualParentPaths}
            />
            <label for='hide-parent-paths'>
              Collapse shared paths into ellipses
            </label>
          </p>
        </fieldset>
        <fieldset>
          <legend>Selection</legend>

          <p>
            The checkboxes here are used to include the paths in the graph
            displays. Use the shift key to update the all child values
            recursively.
          </p>

          <p>
            <button onClick={this.#handleSelectAll}>Select All</button>
            {` `}
            <button onClick={this.#handleSelectNone}>Select None</button>
            {` `}
            <button onClick={this.#handleSelectOnlyBundles}>
              Select Bundles
            </button>
            {` `}
            <button onClick={this.#handleSelectOnlyFields}>
              Select Fields
            </button>
          </p>
        </fieldset>
        <br />
        <fieldset>
          <legend>Color Map</legend>

          <p>
            The color boxes are used to change the color of the fields in the
            graph displays. If a single node includes multiple colors, the color
            of the most important item will be used. Parent-paths are more
            important than sub-paths; if two paths are of the same priority the
            one higher in the list of paths is used.
          </p>

          <p>
            {colorPresets.map(preset => (
              <Fragment key={preset}>
                <button onClick={this.#handleColorPreset.bind(this, preset)}>
                  {preset}
                </button>
                {` `}
              </Fragment>
            ))}
          </p>

          <p>
            <button onClick={this.#handleColorMapExport}>Export</button>
            {` `}
            <DropArea
              types={[Type.JSON]}
              onDropFile={this.#handleColorMapImport}
              compact
            >
              Import
            </DropArea>
            {` `}
            {typeof cmLoadError === 'string' && (
              <small>
                &nbsp;
                {cmLoadError}
              </small>
            )}
          </p>
        </fieldset>
      </>
    )
  }
}

const INDENT_PER_LEVEL = 50

class BundleRows extends Component<
  IReducerProps & { bundle: Bundle; level: number; visible: boolean }
> {
  readonly #handleClick = (evt: Event): void => {
    evt.preventDefault()

    this.props.apply(collapseNode(this.props.bundle))
  }

  #shiftHeld = false
  readonly #handleKeydown = (evt: MouseEvent): void => {
    this.#shiftHeld = evt.shiftKey
  }

  readonly #handleSelectionChange = (
    evt: Event & { currentTarget: HTMLInputElement },
  ): void => {
    evt.preventDefault()

    const { bundle } = this.props

    const keys = this.#shiftHeld ? Array.from(bundle.walk()) : [bundle]
    const value = evt.currentTarget.checked

    this.props.apply(updateSelection(keys.map(k => [k, value])))
  }

  readonly #handleColorChange = (
    evt: Event & { currentTarget: HTMLInputElement },
  ): void => {
    const { bundle } = this.props
    this.props.apply(setColor(bundle, evt.currentTarget.value))
  }

  render(): ComponentChild {
    const { bundle, level, visible, state, apply } = this.props
    const { ns, cm, selection, collapsed, hideEqualParentPaths } = state
    const props: IReducerProps = { state, apply }

    const path = bundle.path
    const expanded = !collapsed.includes(bundle)
    return (
      <>
        <tr class={!visible ? styles.hidden : ''}>
          <td>
            <input
              type='checkbox'
              checked={selection.includes(bundle)}
              onClick={this.#handleKeydown}
              onInput={this.#handleSelectionChange}
            />
            <input
              type='color'
              value={cm.getDefault(bundle)}
              onInput={this.#handleColorChange}
            />
          </td>
          <td style={{ paddingLeft: INDENT_PER_LEVEL * level }}>
            <button
              onClick={this.#handleClick}
              aria-role='toggle'
              disabled={bundle.childCount === 0}
            >
              {expanded ? '∨' : '>'}
            </button>
            &nbsp;
            {path.name}
          </td>
          <td>
            <code>{path.id}</code>
          </td>
          <td>
            <Path
              hideEqualParentPaths={hideEqualParentPaths}
              node={bundle}
              ns={ns}
            />
          </td>
          <td />
          <td>{path.cardinality > 0 ? path.cardinality : 'unlimited'}</td>
        </tr>

        {Array.from(bundle.fields()).map(field => (
          <FieldRow
            {...props}
            visible={visible && expanded}
            level={level + 1}
            field={field}
            key={field.path.id}
          />
        ))}
        {Array.from(bundle.bundles()).map(bundle => (
          <BundleRows
            {...props}
            visible={visible && expanded}
            level={level + 1}
            bundle={bundle}
            key={bundle.path.id}
          />
        ))}
      </>
    )
  }
}

class FieldRow extends Component<
  IReducerProps & { field: Field; level: number; visible: boolean }
> {
  readonly #handleSelectionChange = (
    evt: Event & { currentTarget: HTMLInputElement },
  ): void => {
    this.props.apply(
      updateSelection([[this.props.field, evt.currentTarget.checked]]),
    )
  }

  readonly #handleColorChange = (
    evt: Event & { currentTarget: HTMLInputElement },
  ): void => {
    const { field } = this.props
    this.props.apply(setColor(field, evt.currentTarget.value))
  }

  render(): ComponentChild {
    const {
      state: { ns, cm, selection, hideEqualParentPaths },
      field,
      level,
      visible,
    } = this.props

    const path = field.path
    return (
      <tr class={!visible ? styles.hidden : ''}>
        <td>
          <input
            type='checkbox'
            checked={selection.includes(field)}
            onInput={this.#handleSelectionChange}
          />
          <input
            type='color'
            value={cm.getDefault(field)}
            onInput={this.#handleColorChange}
          />
        </td>
        <td style={{ paddingLeft: INDENT_PER_LEVEL * level }}>{path.name}</td>
        <td>
          <code>{path.id}</code>
        </td>
        <td>
          <Path
            hideEqualParentPaths={hideEqualParentPaths}
            node={field}
            ns={ns}
          />
        </td>
        <td>{path.informativeFieldType}</td>
        <td>{path.cardinality > 0 ? path.cardinality : 'unlimited'}</td>
      </tr>
    )
  }
}

function Path(props: {
  hideEqualParentPaths: boolean
  node: Bundle | Field
  ns: NamespaceMap
}): JSX.Element {
  const { hideEqualParentPaths, node, ns } = props
  const elements = Array.from(node.elements())

  const hasCommonElement = elements.some(
    ({ common }) => typeof common === 'number' && common < 0,
  )

  return (
    <>
      {hideEqualParentPaths && hasCommonElement && (
        <span class={classes(styles.path, styles.path_skip)} />
      )}
      {elements.map(element => (
        <PathElement
          element={element}
          key={element.index}
          hideCommon={hideEqualParentPaths}
          ns={ns}
        />
      ))}
    </>
  )
}

function PathElement({
  element,
  hideCommon,
  ns,
}: {
  element: PathElementT
  hideCommon: boolean
  ns: NamespaceMap
}): JSX.Element | null {
  if (hideCommon && typeof element.common === 'number' && element.common < 0) {
    return null
  }

  return (
    <span
      class={classes(
        styles.path,
        ...elementClass(element).map(clz => styles[clz]),
        (element.common ?? 0) < 0 && styles.path_shared,
      )}
    >
      {ns.apply(element.uri)}
    </span>
  )
}

function elementClass(element: PathElementT): string[] {
  if (element.type === 'concept') {
    if (element.disambiguation === 0)
      return ['path_concept', 'path_disambiguation']
    return ['path_concept']
  }
  if (element.type === 'property') {
    if (element.role === 'datatype') {
      return ['path_datatype']
    }
    return ['path_predicate']
  }
  throw new Error('never reached')
}
