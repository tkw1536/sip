import { type Reducer, type State } from '../..'
import { NamespaceMap } from '../../../../lib/pathbuilder/namespace'
import { type PathTree } from '../../../../lib/pathbuilder/pathtree'

export function newNamespaceMap(tree: PathTree): NamespaceMap {
  return NamespaceMap.generate(tree.uris)
}
export function resetNamespaceMap(): Reducer {
  return ({ namespaceVersion, tree }: State): Partial<State> => ({
    ns: newNamespaceMap(tree),
    nsLoadError: undefined,
    namespaceVersion: namespaceVersion + 1,
  })
}

export function setNamespaceMap(ns: NamespaceMap): Reducer {
  return ({ namespaceVersion }: State): Partial<State> => ({
    ns,
    nsLoadError: undefined,
    namespaceVersion: namespaceVersion + 1,
  })
}
