import { type BoundState, loaders, resetters } from '.'

import { type StateCreator } from 'zustand'
import { NamespaceMap } from '../../../lib/pathbuilder/namespace'
import { type PathTree } from '../../../lib/pathbuilder/pathtree'
export type Slice = State & Actions

interface State {
  ns: NamespaceMap
}

interface Actions {
  resetNamespaceMap: () => void
  setNamespaceMap: (ns: NamespaceMap) => void
}

const initialState: State = {
  ns: NamespaceMap.empty(),
}
const resetState: State = { ...initialState }

export const create: StateCreator<BoundState, [], [], Slice> = (set, get) => {
  resetters.add(() => {
    set(resetState)
  })

  loaders.add(
    async (tree: PathTree): Promise<Partial<State>> => ({
      ns: newNamespaceMap(tree),
    }),
  )

  return {
    ...initialState,

    resetNamespaceMap: () => {
      const { pathtree, setNamespaceMap } = get()
      setNamespaceMap(newNamespaceMap(pathtree))
    },

    setNamespaceMap: (ns: NamespaceMap): void => {
      set({ ns })
    },
  }
}

function newNamespaceMap(tree: PathTree): NamespaceMap {
  return NamespaceMap.generate(tree.uris, undefined, NamespaceMap.KnownPrefixes)
}
