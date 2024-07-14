import { type IReducer, type IState } from '../..'
import { NamespaceMap } from '../../../../../lib/pathbuilder/namespace'
import { type PathTree } from '../../../../../lib/pathbuilder/pathtree'

export function newNamespaceMap(tree: PathTree): NamespaceMap {
  return NamespaceMap.generate(tree.uris)
}
export function resetNamespaceMap(): IReducer {
  return ({ namespaceVersion, tree }: IState): Partial<IState> => ({
    ns: newNamespaceMap(tree),
    nsLoadError: undefined,
    namespaceVersion: namespaceVersion + 1,
  })
}

export function setNamespaceMap(ns: NamespaceMap): IReducer {
  return ({ namespaceVersion }: IState): Partial<IState> => ({
    ns,
    nsLoadError: undefined,
    namespaceVersion: namespaceVersion + 1,
  })
}
