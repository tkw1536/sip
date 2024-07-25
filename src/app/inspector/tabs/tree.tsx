import { Fragment, type JSX } from 'preact'
import { type NamespaceMap } from '../../../lib/pathbuilder/namespace'
import {
  Bundle,
  Field,
  type PathElement as PathElementT,
} from '../../../lib/pathbuilder/pathtree'
import * as styles from './tree.module.css'
import { classes } from '../../../lib/utils/classes'
import { type ColorPreset, colorPresets } from '../state/state/preset'
import { useInspectorStore } from '../state'
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
import { useCallback, useMemo, useRef } from 'preact/hooks'

export default function TreeTab(): JSX.Element {
  const tree = useInspectorStore(s => s.tree)
  const children = useMemo(() => Array.from(tree.children()), [tree])

  return (
    <Panel panel={<TreeTabPanel />} margin={5}>
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
          {children.map(b => (
            <BundleRows visible bundle={b} level={0} key={b.path.id} />
          ))}
        </tbody>
      </table>
    </Panel>
  )
}

function TreeTabPanel(): JSX.Element {
  const apply = useInspectorStore(s => s.apply)
  const cm = useInspectorStore(s => s.cm)
  const hideParents = useInspectorStore(s => s.hideEqualParentPaths)
  const colorLoad = useInspectorStore(s => s.cmLoadError)

  const handleSelectAll = useCallback(
    (evt: Event): void => {
      evt.preventDefault()
      apply(selectAll())
    },
    [apply],
  )

  const handleSelectNone = useCallback(
    (evt: Event): void => {
      evt.preventDefault()
      apply(selectNone())
    },
    [apply],
  )

  const handleSelectOnlyBundles = useCallback(
    (evt: Event): void => {
      evt.preventDefault()
      apply(selectPredicate(x => x instanceof Bundle))
    },
    [apply],
  )

  const handleSelectOnlyFields = useCallback(
    (evt: Event): void => {
      evt.preventDefault()
      apply(selectPredicate(x => x instanceof Field))
    },
    [apply],
  )

  const handleExpandAll = useCallback(
    (evt: Event): void => {
      evt.preventDefault()
      apply(expandAll())
    },
    [apply],
  )

  const handleCollapseAll = useCallback(
    (evt: Event): void => {
      evt.preventDefault()
      apply(collapseAll())
    },
    [apply],
  )

  const handleColorPreset = useCallback(
    (evt: Event & { currentTarget: HTMLButtonElement }): void => {
      evt.preventDefault()
      const { preset } = evt.currentTarget.dataset
      if (typeof preset !== 'string') return

      apply(applyColorPreset(preset as ColorPreset))
    },
    [apply],
  )

  const handleColorMapExport = useCallback(
    (evt: Event): void => {
      const data = JSON.stringify(cm.toJSON(), null, 2)
      const blob = new Blob([data], { type: Type.JSON })
      download(blob, 'colors.json', 'json')
    },
    [cm],
  )

  const handleColorMapImport = useCallback(
    (file: File): void => {
      apply(loadColorMap(file))
    },
    [apply],
  )

  const handleHideEqualParentPaths = useCallback(
    (event: Event & { currentTarget: HTMLInputElement }): void => {
      event.preventDefault()
      apply(setHideEqualParentPaths(event.currentTarget.checked))
    },
    [apply],
  )

  return (
    <>
      <fieldset>
        <legend>Overview</legend>
        <p>
          This page displays the pathbuilder as a hierarchical structure. It is
          similar to the WissKI Interface, except read-only.
        </p>

        <p>
          <button onClick={handleCollapseAll}>Collapse All</button>
          {` `}
          <button onClick={handleExpandAll}>Expand All</button>
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
            checked={hideParents}
            onInput={handleHideEqualParentPaths}
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
          <button onClick={handleSelectAll}>Select All</button>
          {` `}
          <button onClick={handleSelectNone}>Select None</button>
          {` `}
          <button onClick={handleSelectOnlyBundles}>Select Bundles</button>
          {` `}
          <button onClick={handleSelectOnlyFields}>Select Fields</button>
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
              <button data-preset={preset} onClick={handleColorPreset}>
                {preset}
              </button>
              {` `}
            </Fragment>
          ))}
        </p>

        <p>
          <button onClick={handleColorMapExport}>Export</button>
          {` `}
          <DropArea
            types={[Type.JSON]}
            onDropFile={handleColorMapImport}
            compact
          >
            Import
          </DropArea>
          {` `}
          {typeof colorLoad === 'string' && (
            <small>
              &nbsp;
              {colorLoad}
            </small>
          )}
        </p>
      </fieldset>
    </>
  )
}

const INDENT_PER_LEVEL = 50

function BundleRows(props: {
  bundle: Bundle
  level: number
  visible: boolean
}): JSX.Element {
  const { bundle, level, visible } = props

  const apply = useInspectorStore(s => s.apply)
  const cm = useInspectorStore(s => s.cm)
  const ns = useInspectorStore(s => s.ns)
  const selection = useInspectorStore(s => s.selection)
  const collapsed = useInspectorStore(s => s.collapsed)
  const hideParents = useInspectorStore(s => s.hideEqualParentPaths)

  const handleClick = useCallback(
    (evt: Event): void => {
      evt.preventDefault()

      apply(collapseNode(bundle))
    },
    [apply, bundle],
  )

  const shiftHeld = useRef(false)

  const handleKeydown = useCallback(
    (evt: MouseEvent): void => {
      shiftHeld.current = evt.shiftKey
    },
    [shiftHeld],
  )

  const handleSelectionChange = useCallback(
    (evt: Event & { currentTarget: HTMLInputElement }): void => {
      evt.preventDefault()

      const { current: shift } = shiftHeld

      const keys = shift ? Array.from(bundle.walk()) : [bundle]
      const value = evt.currentTarget.checked

      apply(updateSelection(keys.map(k => [k, value])))
    },
    [bundle, apply],
  )

  const handleColorChange = useCallback(
    (evt: Event & { currentTarget: HTMLInputElement }): void => {
      apply(setColor(bundle, evt.currentTarget.value))
    },
    [apply, bundle],
  )

  const path = bundle.path
  const expanded = !collapsed.includes(bundle)

  return (
    <>
      <tr class={!visible ? styles.hidden : ''}>
        <td>
          <input
            type='checkbox'
            checked={selection.includes(bundle)}
            onClick={handleKeydown}
            onInput={handleSelectionChange}
          />
          <input
            type='color'
            value={cm.getDefault(bundle)}
            onInput={handleColorChange}
          />
        </td>
        <td style={{ paddingLeft: INDENT_PER_LEVEL * level }}>
          <button
            onClick={handleClick}
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
          <Path hideEqualParentPaths={hideParents} node={bundle} ns={ns} />
        </td>
        <td />
        <td>{path.cardinality > 0 ? path.cardinality : 'unlimited'}</td>
      </tr>

      {Array.from(bundle.fields()).map(field => (
        <FieldRow
          visible={visible && expanded}
          level={level + 1}
          field={field}
          key={field.path.id}
        />
      ))}
      {Array.from(bundle.bundles()).map(bundle => (
        <BundleRows
          visible={visible && expanded}
          level={level + 1}
          bundle={bundle}
          key={bundle.path.id}
        />
      ))}
    </>
  )
}

function FieldRow(props: {
  field: Field
  level: number
  visible: boolean
}): JSX.Element {
  const { field, level, visible } = props

  const apply = useInspectorStore(s => s.apply)
  const cm = useInspectorStore(s => s.cm)
  const ns = useInspectorStore(s => s.ns)
  const selection = useInspectorStore(s => s.selection)
  const hideParents = useInspectorStore(s => s.hideEqualParentPaths)

  const handleSelectionChange = useCallback(
    (evt: Event & { currentTarget: HTMLInputElement }): void => {
      apply(updateSelection([[field, evt.currentTarget.checked]]))
    },
    [apply, field],
  )

  const handleColorChange = useCallback(
    (evt: Event & { currentTarget: HTMLInputElement }): void => {
      apply(setColor(field, evt.currentTarget.value))
    },
    [apply, field],
  )

  const { path } = field

  return (
    <tr class={!visible ? styles.hidden : ''}>
      <td>
        <input
          type='checkbox'
          checked={selection.includes(field)}
          onInput={handleSelectionChange}
        />
        <input
          type='color'
          value={cm.getDefault(field)}
          onInput={handleColorChange}
        />
      </td>
      <td style={{ paddingLeft: INDENT_PER_LEVEL * level }}>{path.name}</td>
      <td>
        <code>{path.id}</code>
      </td>
      <td>
        <Path hideEqualParentPaths={hideParents} node={field} ns={ns} />
      </td>
      <td>{path.informativeFieldType}</td>
      <td>{path.cardinality > 0 ? path.cardinality : 'unlimited'}</td>
    </tr>
  )
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
