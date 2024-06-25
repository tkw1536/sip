import { Reducer, State } from '../..'
import ColorMap from '../../../../lib/colormap'
import { NamespaceMap } from '../../../../lib/namespace'
import { Pathbuilder } from '../../../../lib/pathbuilder'
import { PathTree } from '../../../../lib/pathtree'
import Selection from '../../../../lib/selection'
import Deduplication from '../../state/deduplication'
import newInspectorState from '../inspector'

export function resetInterface (): State {
  return {
    loaded: false,

    filename: '',

    pathbuilderVersion: -1,
    pathbuilder: new Pathbuilder([]),
    tree: new PathTree([]),

    namespaceVersion: -1,
    ns: NamespaceMap.empty(),

    colorVersion: -1,
    cm: ColorMap.empty(),

    selectionVersion: -1,
    selection: Selection.none(),

    optionVersion: -1,
    deduplication: Deduplication.None,

    // renders for the graphs
    bundleGraphRenderer: '',
    bundleGraphLayout: '',

    modelGraphRenderer: '',
    modelGraphLayout: '',

    collapsed: Selection.none(),

    activeTabIndex: -1
  }
}

export function loadFile (file: File): Reducer {
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
