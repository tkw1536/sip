import { type RState, type RReducer } from '..'

export function newTabID(): string {
  return ''
}

export function setActiveTab(id: string): RReducer {
  return (state: RState): Partial<RState> => ({
    activeTab: id,
  })
}
