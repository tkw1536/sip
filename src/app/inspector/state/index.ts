import { withApply } from '../../../lib/state_management'

import { create } from 'zustand'
import { type IState, resetInspector } from './reducers'
export type { IState } from './reducers'

export const useInspectorStore = create(
  withApply<IState>(() => resetInspector(true)),
)
