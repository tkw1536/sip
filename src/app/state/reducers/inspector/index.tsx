import { State } from '../..'
import { defaultLayout } from '../../../../lib/drivers'
import { Pathbuilder } from '../../../../lib/pathbuilder'
import { PathTree } from '../../../../lib/pathtree'
import { ColorPreset } from '../../state/preset'
import { newBundleRender } from './bundle'
import { newCollapsed } from './collapse'
import { newColor } from './color'
import { newDeduplication, newModelRender } from './model'
import { newNS } from './ns'
import { newSelection } from './selection'
import { newTabIndex } from './tab'

export default function newInspectorState (pathbuilder: Pathbuilder, filename: string): State {
  const tree = PathTree.fromPathbuilder(pathbuilder)

  return {
    loaded: true,

    pathbuilder,
    filename,

    pathbuilderVersion: 0,
    tree,

    namespaceVersion: 0, // this number is updated every time the namespaceMap is updated
    ns: newNS(tree),

    colorVersion: 0,
    cm: newColor(tree, ColorPreset.BlueAndOrange),

    selectionVersion: 0,
    selection: newSelection(tree),

    optionVersion: 0,
    deduplication: newDeduplication(tree),

    bundleGraphRenderer: newBundleRender(tree),
    bundleGraphLayout: defaultLayout,

    modelGraphRenderer: newModelRender(tree),
    modelGraphLayout: defaultLayout,

    collapsed: newCollapsed(tree),

    activeTabIndex: newTabIndex(tree)
  }
}
