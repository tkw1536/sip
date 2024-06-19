/** Graph implements a generic directed graph */
export default class Graph<NodeLabel, EdgeLabel> {
  constructor (public definitelyAcyclic: boolean) {}

  private readonly nodes = new Map<number, NodeLabel>()
  private readonly edges = new Map<number, Map<number, EdgeLabel>>()
  private readonly ids = new IDMap<string>()

  /** addNode adds a new Node with the given label. If it already exists, it is overwritten. */
  addNode (label: NodeLabel, id?: string): number {
    const theId = (typeof id === 'string') ? this.ids.getOrCreate(id) : this.ids.next()
    this.nodes.set(theId, label)
    return theId
  }

  /** addOrUpdateNode creates or updates a node */
  addOrUpdateNode (id: string, update: (label?: NodeLabel) => NodeLabel): number {
    // node already exists => update
    const oldId = this.getNode(id)
    if (typeof oldId === 'number') {
      this.nodes.set(oldId, update(this.nodes.get(oldId)))
      return oldId
    }

    // node doesn't exist yet => create it
    return this.addNode(update(), id)
  }

  /** getNode gets the node or returns null */
  getNode (id: number | string): number | null {
    // if we are given an id, ensure that we have the number
    if (typeof id === 'number') {
      if (!this.nodes.has(id)) {
        return null
      }
      return id
    }

    const theId = this.ids.getOrCreate(id)
    if (!this.nodes.has(theId)) {
      return null
    }
    return theId
  }

  private getNodeId (id: number | string): number {
    return (typeof id === 'string') ? this.ids.get(id) : id
  }

  /** getNodeLabel gets the string belonging to the given node, or null */
  getNodeString (id: number): string | null {
    return this.ids.reverse(this.getNodeId(id))
  }

  /** hasNode checks if the set has the given node */
  hasNode (id: string | number): boolean {
    return this.nodes.has(this.getNodeId(id))
  }

  /** deleteNode removes the given node and any of it's labels */
  deleteNode (id: string | number): void {
    const theId = this.getNodeId(id)

    // remove from known nodes
    this.ids.remove(theId)
    this.nodes.delete(theId)

    // remove edges to and from the node
    this.edges.delete(theId)
    this.edges.forEach(edgeSet => edgeSet.delete(theId))
  }

  /** getNodes gets the ids of the given nodes */
  getNodes (): Array<[number, NodeLabel]> {
    const nodes: Array<[number, NodeLabel]> = []
    this.nodes.forEach((value, key) => {
      nodes.push([key, value])
    })
    return nodes
  }

  /** getNodeLabels gets the labels of the provided node, if any */
  getNodeLabel (id: string | number): NodeLabel | null {
    const theId = this.getNodeId(id)
    return this.nodes.get(theId) ?? null
  }

  /** addEdge adds an edge with the given labels. If the labels are invalid, returns an error. */
  addEdge (from: string | number, to: string | number, label: EdgeLabel): boolean {
    const fromId = this.getNode(from)
    if (typeof fromId !== 'number') {
      console.warn('unknown from', from)
      return false
    }

    const toId = this.getNode(to)
    if (typeof toId !== 'number') {
      console.warn('unknown to', to)
      return false
    }

    // get or initialize this.edges[fromId]
    let fromMap = this.edges.get(fromId)
    if (fromMap == null) {
      fromMap = new Map<number, EdgeLabel>()
      this.edges.set(fromId, fromMap)
    }

    // get or initialize this.edges[fromId][toId];
    fromMap.set(toId, label)

    // and done!
    return true
  }

  /** check if we have an edge */
  hasEdge (from: string | number, to: string | number): boolean {
    const fromId = this.getNode(from)
    if (typeof fromId !== 'number') return false

    const toId = this.getNode(to)
    if (typeof toId !== 'number') return false

    const edgeMap = this.edges.get(fromId)
    if (typeof edgeMap === 'undefined') return false
    return edgeMap.has(toId)
  }

  /** getEdgeLabels gets the labels of the edge from from to to, or null */
  getEdgeLabel (from: string | number, to: string | number): EdgeLabel | null {
    const fromId = this.getNode(from)
    if (typeof fromId !== 'number') return null

    const toId = this.getNode(to)
    if (typeof toId !== 'number') return null

    const fromMap = this.edges.get(fromId)
    if (fromMap == null) return null

    const label = fromMap.get(toId)
    if (typeof label === 'undefined') return null
    return label
  }

  /** getEdges gets the set of all edges */
  getEdges (): Array<[number, number, EdgeLabel]> {
    const edges: Array<[number, number, EdgeLabel]> = []

    this.edges.forEach((fromMap, from) => {
      fromMap.forEach((label, to) => {
        edges.push([from, to, label])
      })
    })

    return edges
  }

  /** deleteEdge removes the between the given edges and any associated labels  */
  deleteEdge (from: number | string, to: number | string): void {
    const fromId = this.getNode(from)
    if (typeof fromId !== 'number') return

    const toId = this.getNode(to)
    if (typeof toId !== 'number') return

    const fromMap = this.edges.get(fromId)
    if (fromMap == null) return

    // delete edges to the given id!
    fromMap.delete(toId)

    // if there are no more edges left, delete the empty map!
    if (fromMap.size === 0) {
      this.edges.delete(fromId)
    }
  }
}

class IDMap<T> {
  static readonly Invalid: number = 0 // a node id that is never used
  private lastID: number = IDMap.Invalid + 1 // the first id being used

  private readonly id2val = new Map<number, T>()
  private readonly val2id = new Map<T, number>()

  /** next returns the next unused id number */
  next (): number {
    return this.lastID++
  }

  /** gets the id of the given element or the invalid id */
  get (t: T): number {
    return this.val2id.get(t) ?? IDMap.Invalid
  }

  /** gets the id of this element, or creates a new one */
  getOrCreate (t: T): number {
    // get the id if we have it
    const old = this.val2id.get(t)
    if (typeof old === 'number') {
      return old
    }

    // create a new id
    const id = this.next()
    this.val2id.set(t, id)
    this.id2val.set(id, t)
    return id
  }

  /**
     * Remove removes the mapping for the given id.
     * The id is not recycled; it will not be used again.
     */
  remove (id: number): void {
    // get the value it maps to
    const val = this.id2val.get(id)
    if (typeof val !== 'string') {
      return
    }

    // and remove it in both directions
    this.id2val.delete(id)
    this.val2id.delete(val)
  }

  /** reverse reverses the id (if any) */
  reverse (id: number): T | null {
    const val = this.id2val.get(id)
    if (val === null) {
      return null
    }
    return val as T
  }
}
