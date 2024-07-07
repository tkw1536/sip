import { type Reducer, type State } from '../..'
import {
  type PathTree,
  type PathTreeNode,
} from '../../../../lib/pathbuilder/pathtree'
import NodeSelection from '../../../../lib/pathbuilder/annotations/selection'

export function newCollapsed(tree: PathTree): NodeSelection {
  return NodeSelection.none()
}

/** collapses the specific id */
export function collapseNode(node: PathTreeNode): Reducer {
  return ({ collapsed }: State): Partial<State> => ({
    collapsed: collapsed.toggle(node),
  })
}

/** collapses all nodes */
export function collapseAll(): Reducer {
  return (state: State): Partial<State> => ({
    collapsed: NodeSelection.all(),
  })
}

/** expands all nodes */
export function expandAll(): Reducer {
  return (state: State): Partial<State> => ({
    collapsed: NodeSelection.none(),
  })
}
