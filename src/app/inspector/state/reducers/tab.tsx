import { type IReducer, type IState } from '.'

export { applyColorPreset as newColor } from '../state/preset'

export function newTabID(): string {
  return ''
}

export function setActiveTab(id: string): IReducer {
  return (state: IState): Partial<IState> => ({
    activeTab: id,
  })
}
