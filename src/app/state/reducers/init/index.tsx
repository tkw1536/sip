import { Reducer, State } from '../..'
import ColorMap from '../../../../lib/colormap'
import { NamespaceMap } from '../../../../lib/namespace'
import { Pathbuilder } from '../../../../lib/pathbuilder'
import { PathTree } from '../../../../lib/pathtree'
import NodeSelection from '../../../../lib/selection'
import Deduplication from '../../state/deduplication'
import newInspectorState from '../inspector'

export function resetInterface (): State {
  return {
    loaded: false,
    activeTabIndex: 0,

    filename: '',

    pathbuilderVersion: -1,
    pathbuilder: new Pathbuilder([]),
    tree: new PathTree([]),

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

    collapsed: NodeSelection.none()
  }
}

export function loaderPathbuilder (file: File): Reducer {
  return async (state: State): Promise<Partial<State> | null> => {
    try {
      const source = await file.text()
      return newInspectorState(Pathbuilder.parse(source), file.name)
    } catch (error: unknown) {
      return {
        loaded: { error }
      }
    }
  }
}
