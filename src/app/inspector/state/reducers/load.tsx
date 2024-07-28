import { type IState } from '.'
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
    showModal: false,
    loadStage: true,

    pathbuilder,
    filename,

    tree,
    diagnostics,

    hideEqualParentPaths: false,

    ns: newNamespaceMap(tree),
    cm: newColor(tree, ColorPreset.BlueAndOrange),
    selection: newSelection(),

    bundleGraphDriver: newBundleDriver(),
    bundleGraphLayout: defaultLayout,
    bundleGraphSeed: null,
    modelDeduplication: newModelDeduplication(),
    modelDisplay: newModelDisplay(),

    modelGraphDriver: newModelDriver(),
    modelGraphLayout: defaultLayout,
    modelGraphSeed: null,

    collapsed: newCollapsed(),

    activeTab: newTabID(),
  }
}
