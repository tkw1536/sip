import { withApply } from '../../../lib/state_management'

import { create } from 'zustand'
import { resetRDFInterface } from './reducers/init'
import { type RState } from './reducers'
export type { RState } from './reducers'

export const useRDFStore = create(
  withApply<RState>(() => resetRDFInterface(true)),
)
