import { type StateCreator } from 'zustand'
import { loaders, resetters, type BoundState } from '.'
import {
  type PathTreeNode,
  type PathTree,
} from '../../../lib/pathbuilder/pathtree'
import NodeSelection from '../../../lib/pathbuilder/annotations/selection'

export type Slice = State & Actions

interface State {
  selection: NodeSelection
}

interface Actions {
  selectAll: () => void
  selectNone: () => void
  selectPredicate: (predicate: (node: PathTreeNode) => boolean) => void
  updateSelection: (pairs: Array<[PathTreeNode, boolean]>) => void
}

const initialState: State = {
  selection: NodeSelection.all(),
}
const resetState: State = { ...initialState }

export const create: StateCreator<BoundState, [], [], Slice> = set => {
  resetters.add(() => {
    set(resetState)
  })

  loaders.add(async (tree: PathTree): Promise<Partial<State>> => ({}))

  return {
    ...initialState,

    selectAll() {
      set({ selection: NodeSelection.all() })
    },
    selectNone() {
      set({ selection: NodeSelection.none() })
    },
    selectPredicate(predicate) {
      set(({ pathtree }) => ({
        selection: NodeSelection.these(
          Array.from(pathtree.walk())
            .filter(predicate)
            .map(node => node.path?.id)
            .filter(x => typeof x === 'string'),
        ),
      }))
    },
    updateSelection(pairs) {
      set(({ selection }) => ({ selection: selection.with(pairs) }))
    },
  }
}
