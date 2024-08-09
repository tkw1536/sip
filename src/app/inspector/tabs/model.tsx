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
import * as styles from './model.module.css'

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
    <Control name='Display' class={styles.duals}>
      <fieldset>
        <legend>Paths</legend>

        <table>
          <tbody>
            <tr>
              <td>
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
              </td>
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
              </td>
            </tr>
          </tbody>
        </table>
      </fieldset>

      <fieldset>
        <legend>Bundles & Fields</legend>

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
                  label='Complex'
                />
              </td>
              <td>
                <ComponentCheckbox
                  {...props}
                  disabled={!props.display.ComplexConceptNodes}
                  value={props.display.BoxConceptNodes}
                  set={(display, BoxConceptNodes) => ({
                    ...display,
                    BoxConceptNodes,
                  })}
                  label='Boxed'
                />
              </td>
            </tr>
            <tr>
              <td colSpan={2}>
                Complex bundle and field nodes show the attached bundles and
                fields as separate nodes.
              </td>
            </tr>
            <tr>
              <td>
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
              <td></td>
            </tr>

            <tr>
              <td>
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
                  label='Field Names'
                />
              </td>
              <td>
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
                  disabled={!props.display.ComplexConceptNodes}
                  label='Field Types'
                />
              </td>
            </tr>
          </tbody>
        </table>
      </fieldset>

      <fieldset>
        <legend>Literals</legend>

        <table>
          <tbody>
            <tr>
              <td>
                <ComponentCheckbox
                  {...props}
                  value={props.display.ComplexLiteralNodes}
                  set={(display, ComplexLiteralNodes) => ({
                    ...display,
                    ComplexLiteralNodes,
                  })}
                  label='Complex'
                />
              </td>
              <td>
                <ComponentCheckbox
                  {...props}
                  value={props.display.BoxLiteralNodes}
                  disabled={!props.display.ComplexLiteralNodes}
                  set={(display, BoxLiteralNodes) => ({
                    ...display,
                    BoxLiteralNodes,
                  })}
                  label='Boxed'
                />
              </td>
            </tr>
            <tr>
              <td colSpan={2}>
                Complex literal nodes show the attached field literals as
                separate nodes.
              </td>
            </tr>
            <tr>
              <td>
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
                  label='Field Names'
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
                  label='Property Labels'
                />
              </td>
            </tr>

            <tr>
              <td>
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
                  disabled={!props.display.ComplexLiteralNodes}
                  label='Field Types'
                />
              </td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </fieldset>
    </Control>
  )
}

interface ComponentCheckboxProps extends ModelDisplayControlProps {
  value: boolean
  disabled?: boolean
  set: (display: ModelDisplay, checked: boolean) => ModelDisplay
  label: string
}

function ComponentCheckbox(props: ComponentCheckboxProps): JSX.Element {
  const { onUpdate, set, display, value, disabled, label } = props
  const handleInput = useCallback(
    (checked: boolean) => {
      onUpdate(set(display, checked))
    },
    [display, onUpdate, set],
  )

  return (
    <Switch
      title={label}
      value={value}
      onInput={handleInput}
      disabled={disabled}
    />
  )
}
