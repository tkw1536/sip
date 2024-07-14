import { type IReducer, type IState } from '../..'
import { type PathTree } from '../../../../../lib/pathbuilder/pathtree'

export { applyColorPreset as newColor } from '../../state/preset'

export function newTabID(tree: PathTree): string {
  return ''
}

export function setActiveTab(id: string): IReducer {
  return (state: IState): Partial<IState> => ({
    activeTab: id,
  })
}
