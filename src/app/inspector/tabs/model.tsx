import { type JSX } from 'preact'
import ModelGraphBuilder from '../../../lib/graph/builders/model'
import type Deduplication from '../state/state/deduplication'
import { explanations, names, values } from '../state/state/deduplication'
import { models } from '../../../lib/drivers/collection'
import GraphDisplay, {
  type PanelProps,
} from '../../../components/graph-display'
import {
  Control,
  DriverControl,
  ExportControl,
} from '../../../components/graph-display/controls'
import {
  setModelDeduplication,
  setModelDisplay,
  setModelDriver,
  setModelLayout,
  setModelSeed,
} from '../state/reducers/model'
import type Graph from '../../../lib/graph'
import {
  type ModelOptions,
  type ModelEdge,
  type ModelNode,
  type ModelDisplay,
  type ModelAttachmentKey,
} from '../../../lib/graph/builders/model/labels'
import { useCallback, useId, useMemo } from 'preact/hooks'
import { useInspectorStore } from '../state'
import useEventCallback from '../../../components/hooks/event'

export default function ModelGraphView(): JSX.Element {
  const tree = useInspectorStore(s => s.tree)
  const pbVersion = useInspectorStore(s => s.pathbuilderVersion)

  const selection = useInspectorStore(s => s.selection)
  const selectionVersion = useInspectorStore(s => s.selectionVersion)
  const deduplication = useInspectorStore(s => s.modelDeduplication)

  const display = useInspectorStore(s => s.modelDisplay)
  const optionVersion = useInspectorStore(s => s.modelGraphOptionVersion)

  const cm = useInspectorStore(s => s.cm)
  const cmVersion = useInspectorStore(s => s.colorVersion)

  const driver = useInspectorStore(s => s.modelGraphDriver)
  const seed = useInspectorStore(s => s.modelGraphSeed)
  const layout = useInspectorStore(s => s.modelGraphLayout)

  const ns = useInspectorStore(s => s.ns)

  const builder = useMemo(() => {
    return async (): Promise<Graph<ModelNode, ModelEdge>> => {
      const builder = new ModelGraphBuilder(tree, {
        include: selection.includes.bind(selection),
        deduplication,
      })
      return builder.build()
    }
  }, [tree, selection, deduplication])

  const builderKey = `${pbVersion}-${selectionVersion}-${optionVersion}-${cmVersion}`

  const options = useMemo(() => ({ ns, cm, display }), [ns, cm, display])

  return (
    <GraphDisplay
      loader={models}
      builderKey={builderKey}
      makeGraph={builder}
      driver={driver}
      seed={seed}
      options={options}
      layout={layout}
      panel={ModelGraphPanel}
    />
  )
}

function ModelGraphPanel(
  props: PanelProps<ModelNode, ModelEdge, ModelOptions, ModelAttachmentKey>,
): JSX.Element {
  const apply = useInspectorStore(s => s.apply)
  const seed = useInspectorStore(s => s.modelGraphSeed)
  const layout = useInspectorStore(s => s.modelGraphLayout)
  const deduplication = useInspectorStore(s => s.modelDeduplication)
  const display = useInspectorStore(s => s.modelDisplay)

  const id = useId()

  const handleChangeMode = useCallback(
    (evt: Event): void => {
      apply(
        setModelDeduplication(
          (evt.target as HTMLInputElement).value as Deduplication,
        ),
      )
    },
    [apply],
  )

  const handleChangeModelRenderer = useCallback(
    (value: string): void => {
      apply(setModelDriver(value))
    },
    [apply],
  )

  const handleChangeDisplay = useCallback(
    (display: ModelDisplay): void => {
      apply(setModelDisplay(display))
    },
    [apply],
  )

  const handleChangeModelLayout = useCallback(
    (value: string): void => {
      apply(setModelLayout(value))
    },
    [apply],
  )

  const handleChangeModelSeed = useCallback(
    (seed: number | null): void => {
      apply(setModelSeed(seed))
    },
    [apply],
  )

  return (
    <>
      <DriverControl
        driverNames={models.names}
        layout={layout}
        seed={seed}
        onChangeDriver={handleChangeModelRenderer}
        onChangeLayout={handleChangeModelLayout}
        onChangeSeed={handleChangeModelSeed}
        {...props}
      />
      <ModelGraphDisplayControl
        display={display}
        onUpdate={handleChangeDisplay}
      />
      <Control name='Deduplication'>
        <p>
          Classes may occur in the pathbuilder more than once. Usually, each
          class would be shown as many times as each occurs. Instead, it might
          make sense to deduplicate nodes and only show classes fewer times.
        </p>
        <p>Changing this value will re-render the graph.</p>

        <div onInput={handleChangeMode}>
          {values.map(v => (
            <p key={v}>
              <input
                name={`${id}-dedup-mode`}
                id={`${id}-dedup-mode-${v}`}
                type='radio'
                checked={deduplication === v}
                value={v}
              />
              <label for={`${id}-dedup-mode-${v}`}>
                <em>{names[v]}.</em>
                &nbsp;
                {explanations[v]}
              </label>
            </p>
          ))}
        </div>
      </Control>
      <ExportControl {...props} />
    </>
  )
}

interface ModelDisplayControlProps {
  display: ModelDisplay
  onUpdate: (display: ModelDisplay) => void
}
function ModelGraphDisplayControl(
  props: ModelDisplayControlProps,
): JSX.Element {
  return (
    <Control name='Display'>
      <p>Changing this value will re-render the graph.</p>

      <table>
        <tbody>
          <tr>
            <td>
              <ComponentCheckbox
                {...props}
                value={props.display.ComplexConceptNodes}
                set={(display, ComplexConceptNodes) => ({
                  ...display,
                  ComplexConceptNodes,
                })}
                label='Complex Concept Nodes'
              />
            </td>
            <td>
              <ComponentCheckbox
                {...props}
                value={props.display.ComplexLiteralNodes}
                set={(display, ComplexLiteralNodes) => ({
                  ...display,
                  ComplexLiteralNodes,
                })}
                label='Complex Literal Nodes'
              />
            </td>
          </tr>
          <tr>
            <td colSpan={2}>
              Disabling these will render appropriate bundle and field labels
              directly at the respective nodes.
            </td>
          </tr>

          <tr>
            <td colSpan={2}>
              <br />
            </td>
          </tr>

          <tr>
            <td>
              <ComponentCheckbox
                {...props}
                value={props.display.Labels.Property}
                set={(display, PropertyLabels) => ({
                  ...display,
                  Labels: {
                    ...display.Labels,
                    Property: PropertyLabels,
                  },
                })}
                label='Property Labels'
              />
              <br />
              <ComponentCheckbox
                {...props}
                value={props.display.Labels.ConceptField}
                set={(display, ConceptFieldLabels) => ({
                  ...display,
                  Labels: {
                    ...display.Labels,
                    ConceptField: ConceptFieldLabels,
                  },
                })}
                label='Field Labels'
              />
              <br />
              <ComponentCheckbox
                {...props}
                value={props.display.Labels.ConceptFieldType}
                set={(display, ConceptFieldTypes) => ({
                  ...display,
                  Labels: {
                    ...display.Labels,
                    ConceptFieldType: ConceptFieldTypes,
                  },
                })}
                label='Field Types'
              />
            </td>

            <td>
              <ComponentCheckbox
                {...props}
                value={props.display.Labels.DatatypeProperty}
                set={(display, DatatypePropertyLabels) => ({
                  ...display,
                  Labels: {
                    ...display.Labels,
                    DatatypeProperty: DatatypePropertyLabels,
                  },
                })}
                label='Datatype Property Labels'
              />
              <br />
              <ComponentCheckbox
                {...props}
                value={props.display.Labels.DatatypeField}
                set={(display, DatatypeFieldLabels) => ({
                  ...display,
                  Labels: {
                    ...display.Labels,
                    DatatypeField: DatatypeFieldLabels,
                  },
                })}
                label='Datatype Field Labels'
              />
              <br />
              <ComponentCheckbox
                {...props}
                value={props.display.Labels.DatatypeFieldType}
                set={(display, DatatypeFieldTypes) => ({
                  ...display,
                  Labels: {
                    ...display.Labels,
                    DatatypeFieldType: DatatypeFieldTypes,
                  },
                })}
                label='Datatype Field Types'
              />
            </td>
          </tr>

          <tr>
            <td colSpan={2}>
              <br />
            </td>
          </tr>

          <tr>
            <td colSpan={2}>
              <ComponentCheckbox
                {...props}
                value={props.display.Labels.Concept}
                set={(display, ConceptLabels) => ({
                  ...display,
                  Labels: {
                    ...display.Labels,
                    Concept: ConceptLabels,
                  },
                })}
                label='Concept Labels'
              />
              <br />
              <ComponentCheckbox
                {...props}
                value={props.display.Labels.Bundle}
                set={(display, BundleLabels) => ({
                  ...display,
                  Labels: {
                    ...display.Labels,
                    Bundle: BundleLabels,
                  },
                })}
                label='Bundle Labels'
              />
            </td>
          </tr>
        </tbody>
      </table>
    </Control>
  )
}

interface ComponentCheckboxProps extends ModelDisplayControlProps {
  value: boolean
  set: (display: ModelDisplay, checked: boolean) => ModelDisplay
  label: string
}

function ComponentCheckbox(props: ComponentCheckboxProps): JSX.Element {
  const { onUpdate, set, display, value, label } = props
  const handleInput = useEventCallback(
    (event: Event & { currentTarget: HTMLInputElement }) => {
      const { checked } = event.currentTarget
      onUpdate(set(display, checked))
    },
    [display, onUpdate, set],
  )

  const id = useId()
  return (
    <>
      <input
        type='checkbox'
        id={id}
        checked={value}
        onInput={handleInput}
      ></input>
      <label for={id}>
        <em>{label}</em>
      </label>
    </>
  )
}

// spellchecker:words dedup Renderable
