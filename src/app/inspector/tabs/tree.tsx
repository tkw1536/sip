import { Fragment, type JSX } from 'preact'
import { type NamespaceMap } from '../../../lib/pathbuilder/namespace'
import {
  Bundle,
  Field,
  type PathElement as PathElementT,
} from '../../../lib/pathbuilder/pathtree'
import * as styles from './tree.module.css'
import { classes } from '../../../lib/utils/classes'
import { type ColorPreset, colorPresets } from '../state/datatypes/color'
import DropArea from '../../../components/form/drop-area'
import download from '../../../lib/utils/download'
import { Type } from '../../../lib/utils/media'
import { Panel } from '../../../components/layout/panel'
import { useCallback, useId, useMemo } from 'preact/hooks'
import useInspectorStore from '../state'
import Button, {
  ButtonGroup,
  ButtonGroupText,
} from '../../../components/form/button'
import { reasonAsError, useAsyncLoad } from '../../../components/hooks/async'
import ColorMap from '../../../lib/pathbuilder/annotations/colormap'
import ErrorDisplay from '../../../components/error'
import {
  Control,
  ControlGroup,
} from '../../../components/graph-display/controls'
import Checkbox from '../../../components/form/checkbox'
import { type ModifierKeys } from '../../../components/form/generic/modifiers'
import { Label } from '../../../components/form/generic'
import { Color } from '../../../components/form/value'

export default function TreeTab(): JSX.Element {
  const tree = useInspectorStore(s => s.pathtree)
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
  return (
    <ControlGroup>
      <OverviewControl />
      <SelectionControl />
      <ColorMapControl />
    </ControlGroup>
  )
}

function OverviewControl(): JSX.Element {
  const hideParents = useInspectorStore(s => s.collapseParentPaths)

  const expandAll = useInspectorStore(s => s.expandAll)
  const collapseAll = useInspectorStore(s => s.collapseAll)

  const setCollapseParentPaths = useInspectorStore(
    s => s.setCollapseParentPaths,
  )

  const id = useId()

  return (
    <Control name='Overview'>
      <p>
        This page displays the pathbuilder as a hierarchical structure. It is
        similar to the WissKI Interface, except read-only.
      </p>

      <ButtonGroup>
        <Button onInput={collapseAll}>Collapse All</Button>
        <Button onInput={expandAll}>Expand All</Button>
      </ButtonGroup>

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
        <Checkbox
          id={id}
          value={hideParents}
          onInput={setCollapseParentPaths}
        />
        <Label id={id}>Collapse shared paths into ellipses</Label>
      </p>
    </Control>
  )
}

function SelectionControl(): JSX.Element {
  const selectAll = useInspectorStore(s => s.selectAll)
  const selectNone = useInspectorStore(s => s.selectNone)

  const selectPredicate = useInspectorStore(s => s.selectPredicate)
  const selectBundles = useCallback(() => {
    selectPredicate(x => x instanceof Bundle)
  }, [selectPredicate])
  const selectFields = useCallback(() => {
    selectPredicate(x => x instanceof Field)
  }, [selectPredicate])

  return (
    <Control name='Selection'>
      <p>
        The checkboxes here are used to include the paths in the graph displays.
        Use the shift key to update the all child values recursively.
      </p>

      <ButtonGroup>
        <Button onInput={selectAll}>Select All</Button>
        <Button onInput={selectNone}>Select None</Button>
        <Button onInput={selectBundles}>Select Bundles</Button>
        <Button onInput={selectFields}>Select Fields</Button>
      </ButtonGroup>
    </Control>
  )
}

function ColorMapControl(): JSX.Element {
  const cm = useInspectorStore(s => s.cm)

  const setColorMap = useInspectorStore(s => s.setColorMap)
  const [cmLoading, cmLoad, cmClear] = useAsyncLoad(
    setColorMap,
    1000,
    10 * 1000,
    reasonAsError,
  )

  const applyColorPreset = useInspectorStore(s => s.applyColorPreset)
  const handleColorPreset = useCallback(
    (preset: ColorPreset): void => {
      cmClear()
      applyColorPreset(preset)
    },
    [cmClear, applyColorPreset],
  )

  const handleColorMapExport = useCallback((): void => {
    cmClear()
    const data = JSON.stringify(cm.toJSON(), null, 2)
    const blob = new Blob([data], { type: Type.JSON })
    download(blob, 'colors.json', 'json')
  }, [cmClear, cm])

  const loadColorMap = useCallback(
    (file: File) => {
      cmLoad(async () => {
        const text = JSON.parse(await file.text())
        const cm = ColorMap.fromJSON(text)
        if (cm === null) throw new Error('invalid ColorMap')
        return cm
      })
    },
    [cmLoad],
  )

  return (
    <Control name='Color Map'>
      <p>
        The color boxes are used to change the color of the fields in the graph
        displays. If a single node includes multiple colors, the color of the
        most important item will be used. Parent-paths are more important than
        sub-paths; if two paths are of the same priority the one higher in the
        list of paths is used.
      </p>

      <p>
        {colorPresets.map(preset => (
          <Fragment key={preset}>
            <Button value={preset} onInput={handleColorPreset}>
              {preset}
            </Button>
            {` `}
          </Fragment>
        ))}
      </p>

      <ButtonGroup>
        <Button value={undefined} onInput={handleColorMapExport}>
          Export
        </Button>
        <DropArea
          types={[Type.JSON]}
          onInput={loadColorMap}
          compact
          disabled={cmLoading?.status === 'pending'}
        >
          Import
        </DropArea>
        <ButtonGroupText>
          {cmLoading?.status === 'rejected' && (
            <small>&nbsp; Import failed</small>
          )}
          {cmLoading?.status === 'fulfilled' && (
            <small>&nbsp; Import successful</small>
          )}
          {cmLoading?.status === 'pending' && <small>&nbsp; Loading</small>}
        </ButtonGroupText>
      </ButtonGroup>

      {cmLoading?.status === 'rejected' && (
        <p>
          <ErrorDisplay error={cmLoading.reason} />
        </p>
      )}
    </Control>
  )
}

const INDENT_PER_LEVEL = 50

function BundleRows(props: {
  bundle: Bundle
  level: number
  visible: boolean
}): JSX.Element {
  const { bundle, level, visible } = props

  const cm = useInspectorStore(s => s.cm)
  const ns = useInspectorStore(s => s.ns)
  const selection = useInspectorStore(s => s.selection)
  const collapsed = useInspectorStore(s => s.collapse)
  const hideParents = useInspectorStore(s => s.collapseParentPaths)
  const toggleNode = useInspectorStore(s => s.toggleNode)

  const handleClick = useCallback((): void => {
    toggleNode(bundle)
  }, [bundle, toggleNode])

  const updateSelection = useInspectorStore(s => s.updateSelection)
  const handleSelectionChange = useCallback(
    (
      checked: boolean,
      dataset: DOMStringMap,
      modifiers: ModifierKeys,
    ): void => {
      const keys = modifiers.shift ? Array.from(bundle.walk()) : [bundle]
      updateSelection(keys.map(k => [k, checked]))
    },
    [bundle, updateSelection],
  )

  const setColor = useInspectorStore(s => s.setColor)
  const handleColorChange = useCallback(
    (color: string): void => {
      setColor(bundle, color)
    },
    [bundle, setColor],
  )

  const path = bundle.path
  const expanded = !collapsed.includes(bundle)

  return (
    <>
      <tr class={!visible ? styles.hidden : ''}>
        <td>
          <Checkbox
            value={selection.includes(bundle)}
            onInput={handleSelectionChange}
          />
          <Color value={cm.getDefault(bundle)} onInput={handleColorChange} />
        </td>
        <td style={{ paddingLeft: INDENT_PER_LEVEL * level }}>
          <Button
            onInput={handleClick}
            aria-role='toggle'
            disabled={bundle.childCount === 0}
          >
            {expanded ? '∨' : '>'}
          </Button>
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

  const cm = useInspectorStore(s => s.cm)
  const ns = useInspectorStore(s => s.ns)
  const selection = useInspectorStore(s => s.selection)
  const hideParents = useInspectorStore(s => s.collapseParentPaths)

  const updateSelection = useInspectorStore(s => s.updateSelection)
  const handleSelectionChange = useCallback(
    (checked: boolean): void => {
      updateSelection([[field, checked]])
    },
    [field, updateSelection],
  )

  const setColor = useInspectorStore(s => s.setColor)
  const handleColorChange = useCallback(
    (color: string): void => {
      setColor(field, color)
    },
    [field, setColor],
  )

  const { path } = field

  return (
    <tr class={!visible ? styles.hidden : ''}>
      <td>
        <Checkbox
          value={selection.includes(field)}
          onInput={handleSelectionChange}
        />
        <Color value={cm.getDefault(field)} onInput={handleColorChange} />
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
