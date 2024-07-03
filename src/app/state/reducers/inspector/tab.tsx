import { type Reducer, type State } from '../..'
import { type PathTree } from '../../../../lib/pathbuilder/pathtree'

export { applyColorPreset as newColor } from '../../state/preset'

export function newTabID (tree: PathTree): string {
  return ''
}

export function setActiveTab (id: string): Reducer {
  return (state: State): Partial<State> => ({
    activeTab: id
  })
}
