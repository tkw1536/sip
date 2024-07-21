import { type IReducer, type IState } from '..'
import ColorMap from '../../../../lib/pathbuilder/annotations/colormap'
import { NamespaceMap } from '../../../../lib/pathbuilder/namespace'
import { Pathbuilder } from '../../../../lib/pathbuilder/pathbuilder'
import { PathTree } from '../../../../lib/pathbuilder/pathtree'
import NodeSelection from '../../../../lib/pathbuilder/annotations/selection'
import Deduplication from '../state/deduplication'
import newInspectorState from './load'
import { newModelDisplay } from '../../../../lib/graph/builders/model/labels'

export function resetInspector(showModal: boolean): IState {
  const tree = new PathTree([])
  return {
    showModal,

    loadStage: false,
    activeTab: '',

    filename: '',

    pathbuilderVersion: -1,
    pathbuilder: new Pathbuilder([]),
    tree,
    diagnostics: [],

    hideEqualParentPaths: false,

    namespaceVersion: -1,
    ns: NamespaceMap.empty(),

    colorVersion: -1,
    cm: ColorMap.empty(),

    selectionVersion: -1,
    selection: NodeSelection.none(),

    modelGraphOptionVersion: -1,
    modelDeduplication: Deduplication.None,
    modelDisplay: newModelDisplay(),

    // renders for the graphs
    bundleGraphDriver: '',
    bundleGraphLayout: '',
    bundleGraphSeed: null,

    modelGraphDriver: '',
    modelGraphLayout: '',
    modelGraphSeed: null,

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
