import { Reducer, State } from '../..'
import { PathTree } from '../../../../lib/pathtree'

export { applyColorPreset as newColor } from '../../state/preset'

export function newTabID (tree: PathTree): string {
  return ''
}

export function setActiveTab (id: string): Reducer {
  return (state: State): Partial<State> => ({
    activeTab: id
  })
}
