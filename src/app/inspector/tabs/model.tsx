import { type JSX, type RefObject } from 'preact'
import ModelGraphBuilder from '../../../lib/graph/builders/model'
import type Deduplication from '../state/state/deduplication'
import { explanations, names, values } from '../state/state/deduplication'
import { models } from '../../../lib/drivers/collection'
import type Driver from '../../../lib/drivers/impl'
import GraphDisplay, {
  Control,
  DriverControl,
  ExportControl,
} from '../../../components/graph-display'
import { type IReducerProps } from '../state'
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
import { useCallback, useId, useMemo, useRef } from 'preact/hooks'

export default function ModelGraphView(props: IReducerProps): JSX.Element {
  const displayRef =
    useRef<
      GraphDisplay<ModelNode, ModelEdge, ModelOptions, ModelAttachmentKey>
    >(null)

  const builder = useMemo(() => {
    return async (): Promise<Graph<ModelNode, ModelEdge>> => {
      const { tree, selection, modelDeduplication: deduplication } = props.state

      const builder = new ModelGraphBuilder(tree, {
        include: selection.includes.bind(selection),
        deduplication,
      })
      return await builder.build()
    }
  }, [
    props.state.tree,
    props.state.selection,
    props.state.modelDeduplication,
    ModelGraphBuilder,
  ])

  const {
    modelGraphLayout,
    modelDisplay: display,
    modelGraphDriver,
    modelGraphSeed,
    pathbuilderVersion,
    selectionVersion,
    modelGraphOptionVersion,
    colorVersion,
    ns,
    cm,
  } = props.state

  const builderKey = `${pathbuilderVersion}-${selectionVersion}-${modelGraphOptionVersion}-${colorVersion}`

  const renderPanel = useMemo(() => {
    return (
      driver: ModelGraphPanelProps['driver'],
      animating: ModelGraphPanelProps['animating'],
    ) => {
      return (
        <ModelGraphPanel
          {...props}
          displayRef={displayRef}
          driver={driver}
          animating={animating}
        />
      )
    }
  }, [ModelGraphPanel, props, displayRef])

  return (
    <GraphDisplay
      ref={displayRef}
      loader={models}
      builderKey={builderKey}
      makeGraph={builder}
      driver={modelGraphDriver}
      seed={modelGraphSeed}
      options={{ ns, cm, display }}
      layout={modelGraphLayout}
      panel={renderPanel}
    />
  )
}

interface ModelGraphPanelProps extends IReducerProps {
  driver: Driver<ModelNode, ModelEdge, ModelOptions, ModelAttachmentKey> | null
  animating: boolean | null
  displayRef: RefObject<
    GraphDisplay<ModelNode, ModelEdge, ModelOptions, ModelAttachmentKey>
  >
}
function ModelGraphPanel(props: ModelGraphPanelProps): JSX.Element {
  const id = useId()
  const {
    driver,
    animating,
    displayRef,
    state: {
      modelDeduplication: deduplication,
      modelGraphLayout,
      modelDisplay,
      modelGraphSeed,
    },
  } = props

  const handleChangeMode = useCallback(
    (evt: Event): void => {
      props.apply(
        setModelDeduplication(
          (evt.target as HTMLInputElement).value as Deduplication,
        ),
      )
    },
    [props.apply, setModelDeduplication],
  )

  const handleChangeModelRenderer = useCallback(
    (value: string): void => {
      props.apply(setModelDriver(value))
    },
    [props.apply, setModelDriver],
  )

  const handleChangeDisplay = useCallback(
    (display: ModelDisplay): void => {
      props.apply(setModelDisplay(display))
    },
    [props.apply, setModelDisplay],
  )

  const handleChangeModelLayout = useCallback(
    (value: string): void => {
      props.apply(setModelLayout(value))
    },
    [props.apply, setModelLayout],
  )

  const handleChangeModelSeed = useCallback(
    (seed: number | null): void => {
      props.apply(setModelSeed(seed))
    },
    [props.apply, setModelSeed],
  )

  const handleResetDriver = useCallback((): void => {
    const { current: display } = displayRef
    display?.remount()
  }, [displayRef])

  return (
    <>
      <DriverControl
        driverNames={models.names}
        driver={driver}
        currentLayout={modelGraphLayout}
        seed={modelGraphSeed}
        onChangeDriver={handleChangeModelRenderer}
        onChangeLayout={handleChangeModelLayout}
        onChangeSeed={handleChangeModelSeed}
        onResetDriver={handleResetDriver}
        animating={animating}
      />
      <ModelGraphDisplayControl
        display={modelDisplay}
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
      <ExportControl driver={driver} display={displayRef.current} />
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
  const handleInput = useCallback(
    (event: Event & { currentTarget: HTMLInputElement }): void => {
      event.preventDefault()
      const { checked } = event.currentTarget
      props.onUpdate(props.set(props.display, checked))
    },
    [props.onUpdate, props.set, props.display],
  )
  const id = useId()
  return (
    <>
      <input
        type='checkbox'
        id={id}
        checked={props.value}
        onInput={handleInput}
      ></input>
      <label for={id}>
        <em>{props.label}</em>
      </label>
    </>
  )
}

// spellchecker:words dedup Renderable
