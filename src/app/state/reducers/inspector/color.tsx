import { type Reducer, type State } from '../..'
import ColorMap from '../../../../lib/pathbuilder/annotations/colormap'
import { type PathTreeNode } from '../../../../lib/pathbuilder/pathtree'
import { applyColorPreset as newColor, type ColorPreset } from '../../state/preset'

export { applyColorPreset as newColor } from '../../state/preset'

/** applies the given color preset to the given tree */
export function applyColorPreset (preset: ColorPreset): Reducer {
  return ({ colorVersion, cm, tree }: State): Partial<State> => ({
    cm: newColor(tree, preset),
    colorVersion: colorVersion + 1,
    cmLoadError: undefined
  })
}

/** sets the color of a specific node */
export function setColor (node: PathTreeNode, color: string): Reducer {
  return ({ colorVersion, cm }: State): Partial<State> => ({
    cm: cm.set(node, color),
    colorVersion: colorVersion + 1,
    cmLoadError: undefined
  })
}

export function loadColorMap (file: File): Reducer {
  return async ({ colorVersion }: State): Promise<Partial<State>> => {
    try {
      const data = JSON.parse(await file.text())
      const cm = ColorMap.fromJSON(data)
      if (cm === null) throw new Error('not a valid colormap')
      return {
        cm,
        colorVersion: colorVersion + 1,
        cmLoadError: undefined
      }
    } catch (e: unknown) {
      return { cmLoadError: String(e) }
    }
  }
}
