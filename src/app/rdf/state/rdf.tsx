import { type Store } from 'rdflib'
import { loaders, resetters, type BoundState } from '.'
import { triples } from '../../../lib/drivers/collection'
import { defaultLayout } from '../../../lib/drivers/impl'

import { type StateCreator } from 'zustand'

export type Slice = State & Actions

interface State {
  modal: boolean

  rdfGraphDriver: string
  rdfGraphLayout: string
  rdfGraphSeed: number | null
}

interface Actions {
  hideModal: () => void

  setRDFDriver: (name: string) => void
  setRDFLayout: (name: string) => void
  setRDFSeed: (seed: number | null) => void
}

const initialState: State = {
  modal: false,

  rdfGraphDriver: triples.defaultDriver,
  rdfGraphLayout: defaultLayout,
  rdfGraphSeed: null,
}
const resetState: State = { ...initialState }

export const create: StateCreator<BoundState, [], [], Slice> = set => {
  resetters.add(() => {
    set(resetState)
  })

  loaders.add(async (store: Store): Promise<Partial<State>> => ({}))

  return {
    ...initialState,

    hideModal: () => {
      set({ modal: false })
    },

    setRDFDriver: (name: string) => {
      set({ rdfGraphDriver: name, rdfGraphLayout: defaultLayout })
    },

    setRDFLayout: (layout: string) => {
      set({ rdfGraphLayout: layout })
    },

    setRDFSeed: (seed: number | null) => {
      set({ rdfGraphSeed: seed })
    },
  }
}
