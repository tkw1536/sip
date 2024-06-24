import { Reducer, State } from '../..'
import { NodeLike } from '../../../../lib/pathtree'
import { applyColorPreset as newColor, ColorPreset } from '../../state/preset'

export { applyColorPreset as newColor } from '../../state/preset'

/** applies the given color preset to the given tree */
export function applyColorPreset (preset: ColorPreset): Reducer {
  return ({ colorVersion, cm, tree }: State): Partial<State> => ({
    cm: newColor(tree, preset),
    colorVersion: colorVersion + 1
  })
}

/** sets the color of a specific node */
export function setColor (node: NodeLike, color: string): Reducer {
  return ({ colorVersion, cm }: State): Partial<State> => ({
    cm: cm.set(node, color),
    colorVersion: colorVersion + 1
  })
}
