import { Reducer, State } from '../..'
import { PathTree } from '../../../../lib/pathtree'
import Selection from '../../../../lib/selection'

export function newSelection (tree: PathTree): Selection {
  return Selection.all()
}

/** selects all items */
export function selectAll (): Reducer {
  return ({ selectionVersion }: State): Partial<State> => ({
    selection: Selection.all(),
    selectionVersion: selectionVersion + 1
  })
}

/** makes sure that the selected items are applied */
export function updateSelection (pairs: Array<[string, boolean]>): Reducer {
  return ({ selection, selectionVersion }: State): Partial<State> => ({
    selection: selection.with(pairs),
    selectionVersion: selectionVersion + 1
  })
}

/** selects none of the item */
export function selectNone (): Reducer {
  return ({ selection, selectionVersion }: State): Partial<State> => ({
    selection: Selection.none(),
    selectionVersion: selectionVersion + 1
  })
}
