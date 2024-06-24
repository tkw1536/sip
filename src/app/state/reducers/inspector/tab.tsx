import { Reducer, State } from '../..'
import { PathTree } from '../../../../lib/pathtree'

export { applyColorPreset as newColor } from '../../state/preset'

export function newTabIndex (tree: PathTree): number {
  return 0
}

export function setActiveTab (index: number): Reducer {
  return (state: State): Partial<State> => ({
    activeTabIndex: index
  })
}
