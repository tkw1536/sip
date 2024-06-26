import { type Reducer, type State } from '../..'
import { type NodeLike, type PathTree } from '../../../../lib/pathtree'
import NodeSelection from '../../../../lib/selection'

export function newCollapsed (tree: PathTree): NodeSelection {
  return NodeSelection.none()
}

/** collapses the specific id */
export function collapseNode (node: NodeLike): Reducer {
  return ({ collapsed }: State): Partial<State> => ({
    collapsed: collapsed.toggle(node)
  })
}

/** collapses all nodes */
export function collapseAll (): Reducer {
  return (state: State): Partial<State> => ({
    collapsed: NodeSelection.all()
  })
}

/** expands all nodes */
export function expandAll (): Reducer {
  return (state: State): Partial<State> => ({
    collapsed: NodeSelection.none()
  })
}
