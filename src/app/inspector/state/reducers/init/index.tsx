import { type IReducer, type IState } from '../..'
import ColorMap from '../../../../../lib/pathbuilder/annotations/colormap'
import { NamespaceMap } from '../../../../../lib/pathbuilder/namespace'
import { Pathbuilder } from '../../../../../lib/pathbuilder/pathbuilder'
import { PathTree } from '../../../../../lib/pathbuilder/pathtree'
import NodeSelection from '../../../../../lib/pathbuilder/annotations/selection'
import Deduplication from '../../state/deduplication'
import newInspectorState from '../inspector'

export function resetInspector(): IState {
  return {
    loadStage: false,
    activeTab: '',

    filename: '',

    pathbuilderVersion: -1,
    pathbuilder: new Pathbuilder([]),
    tree: new PathTree([]),
    diagnostics: [],

    hideEqualParentPaths: false,

    namespaceVersion: -1,
    ns: NamespaceMap.empty(),

    colorVersion: -1,
    cm: ColorMap.empty(),

    selectionVersion: -1,
    selection: NodeSelection.none(),

    optionVersion: -1,
    modelDeduplication: Deduplication.None,

    // renders for the graphs
    bundleGraphDriver: '',
    bundleGraphLayout: '',

    modelGraphDriver: '',
    modelGraphLayout: '',

    rdfGraphDriver: '',
    rdfGraphLayout: '',

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
