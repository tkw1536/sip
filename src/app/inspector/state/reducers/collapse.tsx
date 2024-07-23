import { type IReducer, type IState } from '.'
import { type PathTreeNode } from '../../../../lib/pathbuilder/pathtree'
import NodeSelection from '../../../../lib/pathbuilder/annotations/selection'

export function newCollapsed(): NodeSelection {
  return NodeSelection.none()
}

/** collapses the specific id */
export function collapseNode(node: PathTreeNode): IReducer {
  return ({ collapsed }: IState): Partial<IState> => ({
    collapsed: collapsed.toggle(node),
  })
}

/** collapses all nodes */
export function collapseAll(): IReducer {
  return (state: IState): Partial<IState> => ({
    collapsed: NodeSelection.all(),
  })
}

/** expands all nodes */
export function expandAll(): IReducer {
  return (state: IState): Partial<IState> => ({
    collapsed: NodeSelection.none(),
  })
}
