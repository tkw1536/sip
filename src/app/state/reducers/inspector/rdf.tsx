import { type Reducer, type State } from '../..'
import { triples } from '../../../../lib/drivers/collection'
import { defaultLayout } from '../../../../lib/drivers/impl'
import { type PathTree } from '../../../../lib/pathbuilder/pathtree'

export function newRDFDriver (tree: PathTree): string {
  return triples.defaultDriver
}

export function setRDFDriver (name: string): Reducer {
  return ({ tree }: State): Partial<State> => ({
    rdfGraphDriver: name,
    rdfGraphLayout: defaultLayout
  })
}

export function setRDFLayout (layout: string): Reducer {
  return ({ tree }: State): Partial<State> => ({
    rdfGraphLayout: layout
  })
}
