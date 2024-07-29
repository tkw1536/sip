import { type Store } from 'rdflib'
import { loaders, resetters, type BoundState } from '.'
import { triples } from '../../../lib/drivers/collection'
import { defaultLayout, type Snapshot } from '../../../lib/drivers/impl'

import { type StateCreator } from 'zustand'

export type Slice = State & Actions

interface State {
  rdfGraphDriver: string
  rdfGraphLayout: string
  rdfGraphSeed: number | null
  rdfGraphSnapshot: Snapshot | null
}

interface Actions {
  setRDFDriver: (name: string) => void
  setRDFLayout: (name: string) => void
  setRDFSeed: (seed: number | null) => void
  setRDFSnapshot: (snapshot: Snapshot | null) => void
}

const initialState: State = {
  rdfGraphDriver: triples.defaultDriver,
  rdfGraphLayout: defaultLayout,
  rdfGraphSeed: null,
  rdfGraphSnapshot: null,
}
const resetState: State = { ...initialState }

export const create: StateCreator<BoundState, [], [], Slice> = set => {
  resetters.add(() => {
    set(resetState)
  })

  loaders.add(async (store: Store): Promise<Partial<State>> => ({}))

  return {
    ...initialState,

    setRDFDriver: (name: string) => {
      set({ rdfGraphDriver: name, rdfGraphLayout: defaultLayout })
    },

    setRDFLayout: (layout: string) => {
      set({ rdfGraphLayout: layout })
    },

    setRDFSeed: (seed: number | null) => {
      set({ rdfGraphSeed: seed })
    },

    setRDFSnapshot(snapshot) {
      set({ rdfGraphSnapshot: snapshot })
    },
  }
}
