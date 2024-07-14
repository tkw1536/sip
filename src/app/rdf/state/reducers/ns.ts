import { type Store } from 'rdflib'
import { type RReducer, type RState } from '..'
import { NamespaceMap } from '../../../../lib/pathbuilder/namespace'

export function newNamespaceMap(store: Store): NamespaceMap {
  const entries = Object.entries(store.namespaces)
    .sort(([s1, l1], [s2, l2]) => {
      if (s1 < s2) return -1
      if (s2 > s1) return 1
      return 0
    })
    .map<[string, string]>(([s, l]) => [l, s])
  return NamespaceMap.fromMap(new Map(entries))
}
export function resetNamespaceMap(): RReducer {
  return ({ namespaceVersion, store }: RState): Partial<RState> => ({
    ns: newNamespaceMap(store),
    nsLoadError: undefined,
    namespaceVersion: namespaceVersion + 1,
  })
}

export function setNamespaceMap(ns: NamespaceMap): RReducer {
  return ({ namespaceVersion }: RState): Partial<RState> => ({
    ns,
    nsLoadError: undefined,
    namespaceVersion: namespaceVersion + 1,
  })
}
