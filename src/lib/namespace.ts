interface NamespaceMapExport {
  type: 'namespace-map'
  namespaces: Array<[string, string]>
}

/** NamespaceMap is an immutable namespace map */
export class NamespaceMap {
  static readonly validKey = /^[a-zA-Z0-9_-]+$/

  private readonly parent: NamespaceMap | null
  private readonly short: string | null
  private readonly long: string | null

  private constructor (parent: NamespaceMap | null, long: string | null, short: string | null) {
    this.parent = parent
    this.short = short
    this.long = long
  }

  toJSON (): NamespaceMapExport {
    const namespaces = Array.from(this.toMapInternal().entries()).map(([long, short]) => [short, long] as [string, string])
    return {
      type: 'namespace-map',
      namespaces
    }
  }

  private static isValidNamespaceMap (data: any): data is NamespaceMapExport {
    return (
      (('type' in data) && data.type === 'namespace-map') &&
      (('namespaces' in data) && Array.isArray(data.namespaces) && data.namespaces.findIndex((v: any) => !(Array.isArray(v) && v.length === 2 && typeof v[0] === 'string' && typeof v[1] === 'string')) < 0)
    )
  }

  static fromJSON (data: any): NamespaceMap | null {
    if (!this.isValidNamespaceMap(data)) {
      return null
    }

    const elements = new Map<string, string>()
    data.namespaces.map(([short, long]) => elements.set(long, short))
    return NamespaceMap.fromMap(elements)
  }

  // map holds a map for quickly accessing specific elements.
  private map: Map<string, string> | null = null

  /** toMapInternal returns a reference to the internal map (which should not be mutated) */
  private toMapInternal (): Map<string, string> {
    // if we already have a map, return it!
    if (this.map !== null) return this.map

    // collect all the pairs (these will be in reverse order)
    const pairs: Array<[string, string]> = []

    let ns: NamespaceMap | null = this // eslint-disable-line @typescript-eslint/no-this-alias
    while (ns.parent !== null) {
      if (ns.short !== null && ns.long !== null) {
        pairs.push([ns.long, ns.short])
      }
      ns = ns.parent
    }

    // reverse them to get the right order
    pairs.reverse()

    // create a map for it
    const map = new Map<string, string>()
    pairs.forEach(([long, short]) => {
      map.set(long, short)
    })

    // store and return the map!
    this.map = map
    return map
  }

  /** toMap turns this NamespaceMap into a map */
  toMap (): Map<string, string> {
    return new Map(this.toMapInternal())
  }

  hasLong (long: string): boolean {
    return this.toMapInternal().has(long)
  }

  hasShort (short: string): boolean {
    return new Set(this.toMapInternal().values()).has(short)
  }

  /** add creates a new namespace map with long set to short */
  add (long: string, short: string): NamespaceMap {
    // skip invalid shorts
    if (!NamespaceMap.validKey.test(short)) {
      return this
    }

    return new NamespaceMap(this, long, short)
  }

  /** remove removes a long url from this ns-map */
  remove (long: string): NamespaceMap {
    const elements = this.toMap()
    elements.delete(long)
    return NamespaceMap.fromMap(elements)
  }

  /** apply applies this namespace-map to a string */
  apply (uri: string): string {
    const prefix = this.prefix(uri)
    if (prefix === '') return uri
    return (this.toMapInternal().get(prefix) ?? '') + ':' + uri.substring(prefix.length)
  }

  /** prefix returns the longest prefix of uri for which a namespace is contained within this map */
  prefix (uri: string): string {
    let prefix = '' // prefix used
    this.toMapInternal().forEach((short, long) => {
      // must actually be a prefix
      if (!uri.startsWith(long)) {
        return
      }

      // if we already have a shorter prefix
      // then don't apply it at all!
      if (prefix !== '' && (long <= prefix)) {
        return
      }
      prefix = long
    })
    return prefix
  }

  /** creates a new namespace map from the given map */
  static fromMap (elements: Map<string, string>): NamespaceMap {
    let ns = this.empty()
    elements.forEach((short, long) => { ns = ns.add(long, short) })
    // avoid having to re-compute the internal map (we already know it)
    ns.map = new Map(elements)
    return ns
  }

  /** empty returns an empty NamespaceMap */
  static empty (): NamespaceMap {
    return new NamespaceMap(null, null, null)
  }

  /** generate automatically generates a prefix map */
  static generate (uris: Set<string>, separators: string = '/#', len = 30): NamespaceMap {
    const prefixes = new Set<string>()
    uris.forEach(uri => {
      if (uri === '') {
        return
      }

      const until = Math.max(...Array.from(separators).map(c => uri.lastIndexOf(c)))
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
      let theName = this.makeNamespacePrefix(prefix).substring(0, len)
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
  private static makeNamespacePrefix (uri: string): string {
    // trim off the header
    const index = uri.indexOf('://')
    const name = (index >= 0) ? uri.substring(index + '://'.length) : uri

    // check if we have a special prefix
    const special = this.specialPrefixes.find(([prefix]) => name.startsWith(prefix))
    if (special != null) {
      return special[1]
    }

    // guesstimate a special prefix
    return (name.match(/([a-zA-Z0-9]+)/g) ?? []).find(v => v !== 'www') ?? 'prefix'
  }

  /**
     * Special prefixes used to generate specific names.
     * These are re-used by some WissKIs.
     */
  private static readonly specialPrefixes = Object.entries({
    'erlangen-crm.org/': 'ecrm', // spellchecker:disable-line
    'www.cidoc-crm.org/': 'crm', // spellchecker:disable-line
    'www.w3.org/1999/02/22-rdf-syntax-ns#': 'rdf' // spellchecker:disable-line
  })
}
