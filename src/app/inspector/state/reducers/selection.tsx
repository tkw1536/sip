import { type IReducer, type IState } from '.'
import { type PathTreeNode } from '../../../../lib/pathbuilder/pathtree'
import NodeSelection from '../../../../lib/pathbuilder/annotations/selection'

export function newSelection(): NodeSelection {
  return NodeSelection.all()
}

/** selects all items */
export function selectAll(): IReducer {
  return (): Partial<IState> => ({
    selection: NodeSelection.all(),
  })
}

/** makes sure that the selected items are applied */
export function updateSelection(
  pairs: Array<[PathTreeNode, boolean]>,
): IReducer {
  return ({ selection }: IState): Partial<IState> => ({
    selection: selection.with(pairs),
  })
}

/** selects none of the item */
export function selectNone(): IReducer {
  return ({ selection }: IState): Partial<IState> => ({
    selection: NodeSelection.none(),
  })
}

/** selects none of the item */
export function selectPredicate(
  predicate: (node: PathTreeNode) => boolean,
): IReducer {
  return ({ tree }: IState): Partial<IState> => ({
    selection: NodeSelection.these(
      Array.from(tree.walk())
        .filter(predicate)
        .map(node => node.path?.id)
        .filter(x => typeof x === 'string'),
    ),
  })
}
