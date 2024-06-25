import { Reducer, State } from '../..'
import { PathTree } from '../../../../lib/pathtree'
import Selection from '../../../../lib/selection'

export function newCollapsed (tree: PathTree): Selection {
  return Selection.none()
}

/** collapses the specific id */
export function collapseNode (id: string): Reducer {
  return ({ collapsed }: State): Partial<State> => ({
    collapsed: collapsed.toggle(id)
  })
}

/** collapses all nodes */
export function collapseAll (): Reducer {
  return (state: State): Partial<State> => ({
    collapsed: Selection.all()
  })
}

/** expands all nodes */
export function expandAll (): Reducer {
  return (state: State): Partial<State> => ({
    collapsed: Selection.none()
  })
}
