import { type State } from '../..'
import { defaultLayout } from '../../../../lib/drivers'
import { type Pathbuilder } from '../../../../lib/pathbuilder'
import { PathTree } from '../../../../lib/pathtree'
import { ColorPreset } from '../../state/preset'
import { newBundleDriver } from './bundle'
import { newCollapsed } from './collapse'
import { newColor } from './color'
import { newModelDeduplication, newModelDriver } from './model'
import { newNamespaceMap } from './ns'
import { newSelection } from './selection'
import { newTabID } from './tab'

export default function newInspectorState (pathbuilder: Pathbuilder, filename: string): State {
  const tree = PathTree.fromPathbuilder(pathbuilder)

  return {
    loaded: true,

    pathbuilder,
    filename,

    pathbuilderVersion: 0,
    tree,

    namespaceVersion: 0, // this number is updated every time the namespaceMap is updated
    ns: newNamespaceMap(tree),

    colorVersion: 0,
    cm: newColor(tree, ColorPreset.BlueAndOrange),

    selectionVersion: 0,
    selection: newSelection(tree),

    optionVersion: 0,
    modelDeduplication: newModelDeduplication(tree),

    bundleGraphDriver: newBundleDriver(tree),
    bundleGraphLayout: defaultLayout,

    modelGraphDriver: newModelDriver(tree),
    modelGraphLayout: defaultLayout,

    collapsed: newCollapsed(tree),

    activeTab: newTabID(tree)
  }
}
