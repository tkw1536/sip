import ColorMap from '../../../lib/colormap'
import { Bundle, Field, NodeLike } from '../../../lib/pathtree'
import Color from 'color'

export enum ColorPreset {
  BlueAndOrange = 'Blue And Orange',
  OnePerBundle = 'One Color Per Bundle',
}

export const colorPresets: ColorPreset[] = [
  ColorPreset.BlueAndOrange,
  ColorPreset.OnePerBundle
]

export function applyColorPreset (node: NodeLike, preset: ColorPreset): ColorMap {
  switch (preset) {
    case ColorPreset.OnePerBundle:
      return colorPerBundlePreset(node)
    default:
      return bluePreset(node)
  }
}

function bluePreset (node: NodeLike): ColorMap {
  return ColorMap.generate(node, { field: '#f6b73c', bundle: '#add8e6' })
}

const GOLDEN_ANGLE = 137.508
function colorOf (index: number): string {
  const h = (index > 0 ? index + 1 : 1) * GOLDEN_ANGLE
  return new Color(`hsl(${h % 360},50%,75%)`).hex()
}

function colorPerBundlePreset (root: NodeLike): ColorMap {
  const map = new Map<string, string>()
  let index = 0
  for (const node of root.walk()) {
    if (node instanceof Bundle) {
      map.set(node.path.id, colorOf(index++))
      continue
    }

    if (node instanceof Field) {
      const parentColor = map.get(node.parent.path.id)
      if (typeof parentColor === 'undefined') {
        map.set(node.path.id, colorOf(index++))
        continue
      }
      map.set(node.path.id, parentColor)
    }
  }

  return new ColorMap(ColorMap.globalDefault, map)
}