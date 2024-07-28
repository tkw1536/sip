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
  cmLoadError: Error | undefined
}

interface Actions {
  applyColorPreset: (preset: ColorPreset) => void
  setColor: (node: PathTreeNode, color: string) => void
  loadColorMap: (file: File) => void
}

const initialState: State = {
  cm: ColorMap.empty(),
  cmLoadError: undefined,
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
        cmLoadError: undefined,
      }))
    },

    setColor(node: PathTreeNode, color: string) {
      set(({ cm }) => ({ cm: cm.set(node, color), cmLoadError: undefined }))
    },

    loadColorMap(file) {
      void (async () => {
        try {
          const data = JSON.parse(await file.text())
          const cm = ColorMap.fromJSON(data)
          if (cm === null) throw new Error('not a valid colormap')
          set({ cm, cmLoadError: undefined })
        } catch (e: unknown) {
          set({
            cmLoadError:
              e instanceof Error
                ? e
                : new Error('unable to load colormap', { cause: e }),
          })
        }
      })()
    },
  }
}
