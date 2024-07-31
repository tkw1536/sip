import { type StateCreator } from 'zustand'
import { loaders, resetters, type BoundState } from '.'
import { type PathTree } from '../../../lib/pathbuilder/pathtree'
import { bundles } from '../../../lib/drivers/collection'
import { defaultLayout, type Snapshot } from '../../../lib/drivers/impl'
import { nextInt } from '../../../lib/utils/prng'

export type Slice = State & Actions

interface State {
  bundleDriver: string
  bundleSeed: number
  bundleGraphLayout: string
  bundleSnapshot: Snapshot | null
}

interface Actions {
  setBundleDriver: (driver: string) => void
  setBundleLayout: (layout: string) => void
  setBundleSeed: (seed: number) => void
  setBundleSnapshot: (snapshot: Snapshot | null) => void
}

const initialState: State = {
  bundleDriver: bundles.defaultDriver,
  bundleGraphLayout: defaultLayout,
  bundleSeed: nextInt(),
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
        bundleDriver: driver,
        bundleGraphLayout: defaultLayout,
      })
    },
    setBundleLayout(layout) {
      set({ bundleGraphLayout: layout })
    },
    setBundleSeed(seed) {
      set({ bundleSeed: seed })
    },
    setBundleSnapshot(snapshot) {
      set({ bundleSnapshot: snapshot })
    },
  }
}
