import { type Reducer, type State } from '../..'
import {
  type PathTree,
  type PathTreeNode,
} from '../../../../lib/pathbuilder/pathtree'
import NodeSelection from '../../../../lib/pathbuilder/annotations/selection'

export function newSelection(tree: PathTree): NodeSelection {
  return NodeSelection.all()
}

/** selects all items */
export function selectAll(): Reducer {
  return ({ selectionVersion }: State): Partial<State> => ({
    selection: NodeSelection.all(),
    selectionVersion: selectionVersion + 1,
  })
}

/** makes sure that the selected items are applied */
export function updateSelection(
  pairs: Array<[PathTreeNode, boolean]>,
): Reducer {
  return ({ selection, selectionVersion }: State): Partial<State> => ({
    selection: selection.with(pairs),
    selectionVersion: selectionVersion + 1,
  })
}

/** selects none of the item */
export function selectNone(): Reducer {
  return ({ selection, selectionVersion }: State): Partial<State> => ({
    selection: NodeSelection.none(),
    selectionVersion: selectionVersion + 1,
  })
}
