import { type IReducer, type IState } from '..'
import ColorMap from '../../../../lib/pathbuilder/annotations/colormap'
import { type PathTreeNode } from '../../../../lib/pathbuilder/pathtree'
import { type ColorPreset, applyColorPreset as newColor } from '../state/preset'

export { applyColorPreset as newColor } from '../state/preset'

/** applies the given color preset to the given tree */
export function applyColorPreset(preset: ColorPreset): IReducer {
  return ({ colorVersion, cm, tree }: IState): Partial<IState> => ({
    cm: newColor(tree, preset),
    colorVersion: colorVersion + 1,
    cmLoadError: undefined,
  })
}

/** sets the color of a specific node */
export function setColor(node: PathTreeNode, color: string): IReducer {
  return ({ colorVersion, cm }: IState): Partial<IState> => ({
    cm: cm.set(node, color),
    colorVersion: colorVersion + 1,
    cmLoadError: undefined,
  })
}

export function loadColorMap(file: File): IReducer {
  return async ({ colorVersion }: IState): Promise<Partial<IState>> => {
    try {
      const data = JSON.parse(await file.text())
      const cm = ColorMap.fromJSON(data)
      if (cm === null) throw new Error('not a valid colormap')
      return {
        cm,
        colorVersion: colorVersion + 1,
        cmLoadError: undefined,
      }
    } catch (e: unknown) {
      return { cmLoadError: String(e) }
    }
  }
}
