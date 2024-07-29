import { type StateCreator } from 'zustand'
import { loaders, resetters, type BoundState } from '.'
import { type PathTree } from '../../../lib/pathbuilder/pathtree'
import { bundles } from '../../../lib/drivers/collection'
import { defaultLayout, type Snapshot } from '../../../lib/drivers/impl'

export type Slice = State & Actions

interface State {
  bundleGraphDriver: string
  bundleGraphLayout: string
  bundleSeed: number | null
  bundleSnapshot: Snapshot | null
}

interface Actions {
  setBundleDriver: (driver: string) => void
  setBundleLayout: (layout: string) => void
  setBundleSeed: (seed: number | null) => void
  setBundleSnapshot: (snapshot: Snapshot | null) => void
}

const initialState: State = {
  bundleGraphDriver: bundles.defaultDriver,
  bundleGraphLayout: defaultLayout,
  bundleSeed: null,
  bundleSnapshot: null,
}
const resetState: State = { ...initialState }

export const create: StateCreator<BoundState, [], [], Slice> = set => {
  resetters.add(() => {
    set(resetState)
  })

  loaders.add(async (tree: PathTree): Promise<Partial<State>> => ({}))

  return {
    ...initialState,

    setBundleDriver(driver) {
      set({
        bundleGraphDriver: driver,
        bundleGraphLayout: defaultLayout,
        bundleSeed: null,
      })
    },
    setBundleLayout(layout) {
      set({ bundleGraphLayout: layout, bundleSeed: null })
    },
    setBundleSeed(seed) {
      set({ bundleSeed: seed })
    },
    setBundleSnapshot(snapshot) {
      set({ bundleSnapshot: snapshot })
    },
  }
}
