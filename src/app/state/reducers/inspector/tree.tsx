import { type Reducer, type State } from '../..'

export function setHideEqualParentPaths(
  hideEqualParentPaths: boolean,
): Reducer {
  return (state: State) => ({ hideEqualParentPaths })
}
