import ColorMap from '../../../../lib/pathbuilder/annotations/colormap'
import { NamespaceMap } from '../../../../lib/pathbuilder/namespace'
import { Pathbuilder } from '../../../../lib/pathbuilder/pathbuilder'
import { type Diagnostic, PathTree } from '../../../../lib/pathbuilder/pathtree'
import NodeSelection from '../../../../lib/pathbuilder/annotations/selection'
import Deduplication from '../state/deduplication'
import newInspectorState from './load'
import {
  type ModelDisplay,
  newModelDisplay,
} from '../../../../lib/graph/builders/model/labels'
import { type Reducer } from '../../../../lib/state_management'

export interface IState {
  showModal: boolean
  activeTab: string // the active tab

  loadStage: false | 'loading' | true | { error: unknown } // boolean indicating if file has been loaded, string for error
  filename: string

  pathbuilder: Pathbuilder
  tree: PathTree
  diagnostics: Diagnostic[]

  hideEqualParentPaths: boolean

  ns: NamespaceMap

  cm: ColorMap
  cmLoadError?: string

  selection: NodeSelection // the selection

  // renders for the graphs
  bundleGraphDriver: string
  bundleGraphLayout: string
  bundleGraphSeed: number | null

  modelGraphDriver: string
  modelGraphLayout: string
  modelGraphSeed: number | null
  modelDeduplication: Deduplication
  modelDisplay: ModelDisplay

  collapsed: NodeSelection
}

export function resetInspector(showModal: boolean): IState {
  const tree = new PathTree([])
  return {
    showModal,

    loadStage: false,
    activeTab: '',

    filename: '',

    pathbuilder: new Pathbuilder([]),
    tree,
    diagnostics: [],

    hideEqualParentPaths: false,

    ns: NamespaceMap.empty(),

    cm: ColorMap.empty(),

    selection: NodeSelection.none(),

    // renders for the graphs
    bundleGraphDriver: '',
    bundleGraphLayout: '',
    bundleGraphSeed: null,

    modelGraphDriver: '',
    modelGraphLayout: '',
    modelGraphSeed: null,
    modelDeduplication: Deduplication.None,
    modelDisplay: newModelDisplay(),

    collapsed: NodeSelection.none(),
  }
}

export function setPathbuilderLoading(): Partial<IState> {
  return { loadStage: 'loading' }
}

export function loadPathbuilder(file: File): IReducer {
  return async (state: IState): Promise<Partial<IState> | null> => {
    try {
      const source = await file.text()
      return newInspectorState(Pathbuilder.parse(source), file.name)
    } catch (error: unknown) {
      return {
        loadStage: { error },
      }
    }
  }
}

export function closeModal(): IReducer {
  return { showModal: false }
}

export type IReducer = Reducer<IState>
