import ImmutableMap from './utils/immutable-map'
import ImmutableSet from './utils/immutable-set'

export interface NamespaceMapExport {
  type: 'namespace-map'
  namespaces: Array<[string, string]>
}

/** NamespaceMap is an immutable namespace map */
export class NamespaceMap {
  static readonly validKey = /^[a-zA-Z0-9_-]+$/

  readonly #map: ImmutableMap<string, string>
  readonly #shorts: ImmutableSet<string>
  private constructor(entries: Iterable<[string, string]>) {
    const shorts = new Set<string>()

    this.#map = new ImmutableMap(
      Array.from(entries)
        .reverse()
        .filter(([_, short]): boolean => {
          if (shorts.has(short)) {
            return false
          }
          shorts.add(short)
          return true
        }),
    )
    this.#shorts = new ImmutableSet(shorts)
  }

  toJSON(): NamespaceMapExport {
    const namespaces = Array.from(this.#map).map(
      ([long, short]) => [short, long] as [string, string],
    )
    return {
      type: 'namespace-map',
      namespaces,
    }
  }

  static #isValidNamespaceMap(data: any): data is NamespaceMapExport {
    if (!('type' in data && data.type === 'namespace-map')) {
      return false
    }
    if (!('namespaces' in data)) {
      return false
    }

    const { namespaces } = data
    if (!Array.isArray(namespaces)) {
      return false
    }
    return namespaces.every(
      (v: any) =>
        Array.isArray(v) &&
        v.length === 2 &&
        typeof v[0] === 'string' &&
        typeof v[1] === 'string',
    )
  }

  static fromJSON(data: any): NamespaceMap | null {
    if (!this.#isValidNamespaceMap(data)) {
      return null
    }

    const elements = new Map<string, string>()
    data.namespaces.map(([short, long]) => elements.set(long, short))
    return NamespaceMap.fromMap(elements)
  }

  /** toMap turns this NamespaceMap into a map */
  toMap(): Map<string, string> {
    return new Map(this.#map)
  }

  hasLong(long: string): boolean {
    return this.#map.has(long)
  }

  hasShort(short: string): boolean {
    return this.#shorts.has(short)
  }

  /** add creates a new namespace map with long set to short */
  add(long: string, short: string): NamespaceMap {
    // skip invalid shorts
    if (!NamespaceMap.validKey.test(short)) {
      return this
    }

    return new NamespaceMap(this.#map.set(long, short))
  }

  /** remove removes a long url from this ns-map */
  remove(long: string): NamespaceMap {
    const elements = this.toMap()
    elements.delete(long)
    return NamespaceMap.fromMap(elements)
  }

  /** apply applies this namespace-map to a string */
  apply(uri: string): string {
    const prefix = this.prefix(uri)
    if (prefix === '') return uri
    return (this.#map.get(prefix) ?? '') + ':' + uri.substring(prefix.length)
  }

  /** prefix returns the longest prefix of uri for which a namespace is contained within this map */
  prefix(uri: string): string {
    let prefix = '' // prefix used
    this.#map.forEach((short, long) => {
      // must actually be a prefix
      if (!uri.startsWith(long)) {
        return
      }

      // if we already have a shorter prefix
      // then don't apply it at all!
      if (prefix !== '' && long <= prefix) {
        return
      }
      prefix = long
    })
    return prefix
  }

  /** creates a new namespace map from the given map */
  static fromMap(elements: Map<string, string>): NamespaceMap {
    let ns = this.empty()
    elements.forEach((short, long) => {
      ns = ns.add(long, short)
    })
    return ns
  }

  /** empty returns an empty NamespaceMap */
  static empty(): NamespaceMap {
    return new NamespaceMap([])
  }

  /** generate automatically generates a prefix map */
  static generate(
    uris: Set<string>,
    separators: string = '/#',
    len = 30,
  ): NamespaceMap {
    const prefixes = new Set<string>()
    uris.forEach(uri => {
      if (uri === '') {
        return
      }

      const until = Math.max(
        ...Array.from(separators).map(c => uri.lastIndexOf(c)),
      )
      // no valid prefix
      if (until === -1) {
        return
      }

      // compute the prefix
      const prefix = uri.substring(0, until + 1)

      // we already have a prefix
      if (prefixes.has(prefix)) {
        return
      }

      let hadPrefix = false
      prefixes.forEach(old => {
        // we have a prefix that is longer
        // so delete it
        if (old.startsWith(prefix)) {
          prefixes.delete(old)
        }

        // we had a subset of this one already
        // so don't add it!
        if (prefix.startsWith(old)) {
          hadPrefix = true
        }
      })

      // don't add the prefix
      if (hadPrefix) {
        return
      }
      prefixes.add(prefix)
    })

    const ns = new Map<string, string>()

    const seen = new Map<string, number>()
    prefixes.forEach(prefix => {
      let theName = this.#makeNamespacePrefix(prefix).substring(0, len)
      const counter = seen.get(theName)
      if (typeof counter === 'number') {
        seen.set(theName, counter + 1)
        theName = `${theName}_${counter}`
      } else {
        seen.set(theName, 1)
      }

      ns.set(prefix, theName)
    })
    return this.fromMap(ns)
  }

  /**
   * returns a suitable prefix for the given url
   */
  static #makeNamespacePrefix(uri: string): string {
    // trim off the header
    const index = uri.indexOf('://')
    const name = index >= 0 ? uri.substring(index + '://'.length) : uri

    // check if we have a special prefix
    const special = this.#specialPrefixes.find(([prefix]) =>
      name.startsWith(prefix),
    )
    if (special != null) {
      return special[1]
    }

    // guesstimate a special prefix
    return (
      (name.match(/([a-zA-Z0-9]+)/g) ?? []).find(v => v !== 'www') ?? 'prefix'
    )
  }

  /**
   * Special prefixes used to generate specific names.
   * These are re-used by some WissKIs.
   */
  static readonly #specialPrefixes = Object.entries({
    'erlangen-crm.org/': 'ecrm', // spellchecker:disable-line
    'www.cidoc-crm.org/': 'crm', // spellchecker:disable-line
    'www.w3.org/1999/02/22-rdf-syntax-ns#': 'rdf', // spellchecker:disable-line
  })
}
