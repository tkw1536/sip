import { Reducer, State } from '../..'
import { NamespaceMap } from '../../../../lib/namespace'
import { PathTree } from '../../../../lib/pathtree'

export function newNamespaceMap (tree: PathTree): NamespaceMap {
  return NamespaceMap.generate(tree.uris)
}

export function resetNamespaceMap (): Reducer {
  return ({ namespaceVersion, tree }: State): Partial<State> => ({
    ns: newNamespaceMap(tree),
    nsLoadError: undefined,
    namespaceVersion: namespaceVersion + 1
  })
}

export function deleteNamespace (long: string): Reducer {
  return ({ namespaceVersion, ns }: State): Partial<State> => ({
    ns: ns.remove(long),
    nsLoadError: undefined,
    namespaceVersion: namespaceVersion + 1
  })
}

/** updates the given long uri to have the new short uri */
export function updateNamespace (long: string, newShort: string): Reducer {
  return ({ namespaceVersion, ns }: State): Partial<State> | null => {
    const mp = ns.toMap()
    if (!mp.has(long)) {
      return null
    }

    // update and use a new map!
    mp.set(long, newShort)

    return { ns: NamespaceMap.fromMap(mp), nsLoadError: undefined, namespaceVersion: namespaceVersion + 1 }
  }
}

/** adds the new given long and short urls */
export function addNamespace (long: string, short: string): Reducer {
  return ({ namespaceVersion, ns }: State): Partial<State> | null => {
    // if we already have the short or the long don't do anything
    if (ns.hasShort(short) || ns.hasLong(long)) {
      return null
    }

    return {
      ns: ns.add(long, short),
      nsLoadError: undefined,
      namespaceVersion: namespaceVersion + 1
    }
  }
}

export function loadNamespaceMap (file: File): Reducer {
  return async ({ namespaceVersion }: State): Promise<Partial<State>> => {
    try {
      const data = JSON.parse(await file.text())
      const ns = NamespaceMap.fromJSON(data)
      if (ns === null) throw new Error('not a valid namespace map')
      return {
        ns,
        namespaceVersion: namespaceVersion + 1,
        nsLoadError: undefined
      }
    } catch (e: unknown) {
      return { nsLoadError: String(e) }
    }
  }
}
