import { type IReducer, type IState } from '../..'

export function setHideEqualParentPaths(
  hideEqualParentPaths: boolean,
): IReducer {
  return (state: IState) => ({ hideEqualParentPaths })
}
