import { type StateCreator } from 'zustand'
import { loaders, resetters, type BoundState } from '.'
import { type PathTree } from '../../../lib/pathbuilder/pathtree'
import { bundles } from '../../../lib/drivers/collection'
import { defaultLayout } from '../../../lib/drivers/impl'

export type Slice = State & Actions

interface State {
  bundleGraphDriver: string
  bundleGraphLayout: string
  bundleSeed: number | null
}

interface Actions {
  setBundleDriver: (driver: string) => void
  setBundleLayout: (layout: string) => void
  setBundleSeed: (seed: number | null) => void
}

const initialState: State = {
  bundleGraphDriver: bundles.defaultDriver,
  bundleGraphLayout: defaultLayout,
  bundleSeed: null,
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
      set({ bundleGraphDriver: driver })
    },
    setBundleLayout(layout) {
      set({ bundleGraphLayout: layout })
    },
    setBundleSeed(seed) {
      set({ bundleSeed: seed })
    },
  }
}
