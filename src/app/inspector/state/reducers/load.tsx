import { type IState } from '..'
import { defaultLayout } from '../../../../lib/drivers/impl'
import { newModelDisplay } from '../../../../lib/graph/builders/model/labels'
import { type Pathbuilder } from '../../../../lib/pathbuilder/pathbuilder'
import { type Diagnostic, PathTree } from '../../../../lib/pathbuilder/pathtree'
import { ColorPreset } from '../state/preset'
import { newBundleDriver } from './bundle'
import { newCollapsed } from './collapse'
import { newColor } from './color'
import { newModelDeduplication, newModelDriver } from './model'
import { newNamespaceMap } from './ns'
import { newSelection } from './selection'
import { newTabID } from './tab'

export default function newInspectorState(
  pathbuilder: Pathbuilder,
  filename: string,
): IState {
  const diagnostics: Diagnostic[] = []
  const tree = PathTree.fromPathbuilder(pathbuilder, diag =>
    diagnostics.push(diag),
  )

  diagnostics.forEach(diag => {
    console.warn('diagnostic received while reading pathbuilder: ', diag)
  })

  return {
    loadStage: true,

    pathbuilder,
    filename,

    pathbuilderVersion: 0,
    tree,
    diagnostics,

    hideEqualParentPaths: false,

    namespaceVersion: 0, // this number is updated every time the namespaceMap is updated
    ns: newNamespaceMap(tree),

    colorVersion: 0,
    cm: newColor(tree, ColorPreset.BlueAndOrange),

    selectionVersion: 0,
    selection: newSelection(),

    modelGraphOptionVersion: 0,
    modelDeduplication: newModelDeduplication(),
    modelDisplay: newModelDisplay(),

    bundleGraphDriver: newBundleDriver(),
    bundleGraphLayout: defaultLayout,

    modelGraphDriver: newModelDriver(),
    modelGraphLayout: defaultLayout,

    collapsed: newCollapsed(),

    activeTab: newTabID(),
  }
}
