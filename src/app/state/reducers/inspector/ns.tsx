import { Reducer, State } from '../..'
import { NamespaceMap } from '../../../../lib/namespace'
import { PathTree } from '../../../../lib/pathtree'

export function newNS (tree: PathTree): NamespaceMap {
  return NamespaceMap.generate(tree.uris)
}

export function resetNS (): Reducer {
  return ({ namespaceVersion, tree }: State): Partial<State> => ({
    ns: newNS(tree),
    namespaceVersion: namespaceVersion + 1
  })
}

export function deleteNS (long: string): Reducer {
  return ({ namespaceVersion, ns }: State): Partial<State> => ({
    ns: ns.remove(long),
    namespaceVersion: namespaceVersion + 1
  })
}

/** updates the given long uri to have the new short uri */
export function updateNS (long: string, newShort: string): Reducer {
  return ({ namespaceVersion, ns }: State): Partial<State> | null => {
    const mp = ns.toMap()
    if (!mp.has(long)) {
      return null
    }

    // update and use a new map!
    mp.set(long, newShort)

    return { ns: NamespaceMap.fromMap(mp), namespaceVersion: namespaceVersion + 1 }
  }
}

/** adds the new given long and short urls */
export function addNS (long: string, short: string): Reducer {
  return ({ namespaceVersion, ns }: State): Partial<State> | null => {
    // if we already have the short or the long don't do anything
    if (ns.hasShort(short) || ns.hasLong(long)) {
      return null
    }

    return {
      ns: ns.add(long, short),
      namespaceVersion: namespaceVersion + 1
    }
  }
}
