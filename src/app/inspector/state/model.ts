import { type StateCreator } from 'zustand'
import { loaders, resetters, type BoundState } from '.'
import { type PathTree } from '../../../lib/pathbuilder/pathtree'
import Deduplication from './datatypes/deduplication'
import { type ModelDisplay } from '../../../lib/graph/builders/model/labels'
import { models } from '../../../lib/drivers/collection'
import { defaultLayout, type Snapshot } from '../../../lib/drivers/impl'
import { nextInt } from '../../../lib/utils/prng'

export type Slice = State & Actions

interface State {
  modelDriver: string
  modelSeed: number
  modelLayout: string
  modelDeduplication: Deduplication
  modelDisplay: ModelDisplay
  modelSnapshot: Snapshot | null
}

interface Actions {
  setModelDriver: (driver: string) => void
  setModelLayout: (layout: string) => void
  setModelSeed: (seed: number) => void
  setModelDeduplication: (deduplication: Deduplication) => void
  setModelDisplay: (display: ModelDisplay) => void
  setModelSnapshot: (snapshot: Snapshot | null) => void
}

const initialState: State = {
  modelDriver: models.defaultDriver,
  modelLayout: defaultLayout,
  modelSeed: nextInt(),
  modelDeduplication: Deduplication.Bundle,
  modelDisplay: {
    ComplexConceptNodes: true,
    ComplexLiteralNodes: true,
    BoxConceptNodes: true,
    BoxLiteralNodes: true,
    Labels: {
      Concept: true,
      Property: true,

      Bundle: true,
      ConceptField: true,
      ConceptFieldType: true,

      DatatypeFieldType: true,
      DatatypeField: true,
      DatatypeProperty: true,
    },
  },
  modelSnapshot: null,
}
const resetState: State = { ...initialState }

export const create: StateCreator<BoundState, [], [], Slice> = set => {
  resetters.add(() => {
    set(resetState)
  })

  loaders.add(async (tree: PathTree): Promise<Partial<State>> => ({}))

  return {
    ...initialState,

    setModelDriver(driver) {
      set({
        modelDriver: driver,
        modelLayout: defaultLayout,
        modelSnapshot: null,
      })
    },
    setModelLayout(layout) {
      set({ modelLayout: layout, modelSnapshot: null })
    },
    setModelDeduplication(deduplication) {
      set({ modelDeduplication: deduplication })
    },
    setModelDisplay(display) {
      set({ modelDisplay: display })
    },
    setModelSeed(seed) {
      set({ modelSeed: seed, modelSnapshot: null })
    },
    setModelSnapshot(snapshot) {
      set({ modelSnapshot: snapshot })
    },
  }
}
