import { type IReducer, type IState } from '..'
import {
  type PathTree,
  type PathTreeNode,
} from '../../../../lib/pathbuilder/pathtree'
import NodeSelection from '../../../../lib/pathbuilder/annotations/selection'

export function newSelection(tree: PathTree): NodeSelection {
  return NodeSelection.all()
}

/** selects all items */
export function selectAll(): IReducer {
  return ({ selectionVersion }: IState): Partial<IState> => ({
    selection: NodeSelection.all(),
    selectionVersion: selectionVersion + 1,
  })
}

/** makes sure that the selected items are applied */
export function updateSelection(
  pairs: Array<[PathTreeNode, boolean]>,
): IReducer {
  return ({ selection, selectionVersion }: IState): Partial<IState> => ({
    selection: selection.with(pairs),
    selectionVersion: selectionVersion + 1,
  })
}

/** selects none of the item */
export function selectNone(): IReducer {
  return ({ selection, selectionVersion }: IState): Partial<IState> => ({
    selection: NodeSelection.none(),
    selectionVersion: selectionVersion + 1,
  })
}
