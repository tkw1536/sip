import { type BoundState, loaders, resetters } from '.'

import { type StateCreator } from 'zustand'
import {
  type PathTreeNode,
  type PathTree,
} from '../../../lib/pathbuilder/pathtree'
import ColorMap from '../../../lib/pathbuilder/annotations/colormap'
import { applyColorPreset, ColorPreset } from './datatypes/color'
export type Slice = State & Actions

interface State {
  cm: ColorMap
}

interface Actions {
  applyColorPreset: (preset: ColorPreset) => void
  setColor: (node: PathTreeNode, color: string) => void
  setColorMap: (map: ColorMap) => void
}

const initialState: State = {
  cm: ColorMap.empty(),
}
const resetState: State = { ...initialState }

export const create: StateCreator<BoundState, [], [], Slice> = (set, get) => {
  resetters.add(() => {
    set(resetState)
  })

  loaders.add(
    async (tree: PathTree): Promise<Partial<State>> => ({
      cm: applyColorPreset(tree, ColorPreset.BlueAndOrange),
    }),
  )

  return {
    ...initialState,

    applyColorPreset(preset) {
      set(({ pathtree }) => ({
        cm: applyColorPreset(pathtree, preset),
      }))
    },

    setColor(node: PathTreeNode, color: string) {
      set(({ cm }) => ({ cm: cm.set(node, color), cmLoadError: undefined }))
    },

    setColorMap(cm: ColorMap) {
      set({ cm })
    },
  }
}
