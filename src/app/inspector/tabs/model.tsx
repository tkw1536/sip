import { type JSX } from 'preact'
import ModelGraphBuilder from '../../../lib/graph/builders/model'
import { explanations, names, values } from '../state/datatypes/deduplication'
import { models } from '../../../lib/drivers/collection'
import GraphDisplay, {
  type PanelProps,
} from '../../../components/graph-display'
import {
  Control,
  ControlGroup,
  DriverControl,
  ExportControl,
} from '../../../components/graph-display/controls'

import {
  type ModelOptions,
  type ModelEdge,
  type ModelNode,
  type ModelDisplay,
  type ModelAttachmentKey,
} from '../../../lib/graph/builders/model/labels'
import { useCallback, useMemo } from 'preact/hooks'
import useInspectorStore from '../state'
import { Radio } from '../../../components/form/dropdown'
import { Switch } from '../../../components/form/checkbox'
import { type ContextFlags } from '../../../lib/drivers/impl'

export default function ModelGraphView(): JSX.Element {
  const tree = useInspectorStore(s => s.pathtree)
  const selection = useInspectorStore(s => s.selection)
  const deduplication = useInspectorStore(s => s.modelDeduplication)
  const display = useInspectorStore(s => s.modelDisplay)
  const cm = useInspectorStore(s => s.cm)
  const driver = useInspectorStore(s => s.modelDriver)
  const seed = useInspectorStore(s => s.modelSeed)
  const layout = useInspectorStore(s => s.modelLayout)

  const snapshot = useInspectorStore(s => s.modelSnapshot)
  const setSnapshot = useInspectorStore(s => s.setModelSnapshot)

  const ns = useInspectorStore(s => s.ns)

  const builder = useCallback(() => {
    const builder = new ModelGraphBuilder(tree, {
      include: selection.includes.bind(selection),
      deduplication,
    })
    return builder.build()
  }, [tree, selection, deduplication])

  const flags = useMemo<ContextFlags<ModelOptions>>(
    () => ({ options: { ns, cm, display }, layout, seed }),
    [cm, display, layout, ns, seed],
  )

  return (
    <GraphDisplay
      loader={models}
      makeGraph={builder}
      name={driver}
      flags={flags}
      panel={ModelGraphPanel}
      snapshot={snapshot}
      setSnapshot={setSnapshot}
    />
  )
}

function ModelGraphPanel(
  props: PanelProps<ModelNode, ModelEdge, ModelOptions, ModelAttachmentKey>,
): JSX.Element {
  const driver = useInspectorStore(s => s.modelDriver)

  const seed = useInspectorStore(s => s.modelSeed)
  const layout = useInspectorStore(s => s.modelLayout)
  const deduplication = useInspectorStore(s => s.modelDeduplication)
  const display = useInspectorStore(s => s.modelDisplay)

  const setModelDeduplication = useInspectorStore(s => s.setModelDeduplication)
  const setModelDriver = useInspectorStore(s => s.setModelDriver)
  const setModelDisplay = useInspectorStore(s => s.setModelDisplay)
  const setModelLayout = useInspectorStore(s => s.setModelLayout)
  const setModelSeed = useInspectorStore(s => s.setModelSeed)

  return (
    <ControlGroup>
      <DriverControl
        driverNames={models.names}
        driver={driver}
        layout={layout}
        seed={seed}
        onChangeDriver={setModelDriver}
        onChangeLayout={setModelLayout}
        onChangeSeed={setModelSeed}
        {...props}
      />
      <ModelGraphDisplayControl display={display} onUpdate={setModelDisplay} />
      <Control name='Deduplication'>
        <p>
          Classes may occur in the pathbuilder more than once. Usually, each
          class would be shown as many times as each occurs. Instead, it might
          make sense to deduplicate nodes and only show classes fewer times.
        </p>
        <p>Changing this value will re-render the graph.</p>

        <Radio
          value={deduplication}
          values={values}
          onInput={setModelDeduplication}
          titles={names}
          descriptions={explanations}
        />
      </Control>
      <ExportControl {...props} />
    </ControlGroup>
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
            <td>
              <ComponentCheckbox
                {...props}
                value={props.display.BoxCompoundNodes}
                set={(display, BoxCompoundNodes) => ({
                  ...display,
                  BoxCompoundNodes,
                })}
                label='Box Compound Nodes'
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
  const handleInput = useCallback(
    (checked: boolean) => {
      onUpdate(set(display, checked))
    },
    [display, onUpdate, set],
  )

  return <Switch title={label} value={value} onInput={handleInput} />
}
