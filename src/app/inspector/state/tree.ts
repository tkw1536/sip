import { type StateCreator } from 'zustand'
import { loaders, resetters, type BoundState } from '.'
import {
  type PathTreeNode,
  type PathTree,
} from '../../../lib/pathbuilder/pathtree'
import NodeSelection from '../../../lib/pathbuilder/annotations/selection'

export type Slice = State & Actions

interface State {
  collapse: NodeSelection
  collapseParentPaths: boolean
}

interface Actions {
  setCollapseParentPaths: (value: boolean) => void

  toggleNode: (node: PathTreeNode) => void
  collapseAll: () => void
  expandAll: () => void
}

const initialState: State = {
  collapse: NodeSelection.none(),
  collapseParentPaths: false,
}
const resetState: State = { ...initialState }

export const create: StateCreator<BoundState, [], [], Slice> = set => {
  resetters.add(() => {
    set(resetState)
  })

  loaders.add(async (tree: PathTree): Promise<Partial<State>> => ({}))

  return {
    ...initialState,
    setCollapseParentPaths: (value: boolean) => {
      set({ collapseParentPaths: value })
    },

    toggleNode(node) {
      set(({ collapse }) => ({ collapse: collapse.toggle(node) }))
    },

    collapseAll() {
      set({ collapse: NodeSelection.all() })
    },
    expandAll() {
      set({ collapse: NodeSelection.none() })
    },
  }
}
