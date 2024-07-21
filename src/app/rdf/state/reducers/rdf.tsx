import { type RReducer, type RState } from '..'
import { triples } from '../../../../lib/drivers/collection'
import { defaultLayout } from '../../../../lib/drivers/impl'

export function newRDFDriver(): string {
  return triples.defaultDriver
}

export function setRDFDriver(name: string): RReducer {
  return (): Partial<RState> => ({
    rdfGraphDriver: name,
    rdfGraphLayout: defaultLayout,
  })
}

export function setRDFLayout(layout: string): RReducer {
  return (): Partial<RState> => ({
    rdfGraphLayout: layout,
  })
}

export function setRDFSeed(seed: number | null): RReducer {
  return (): Partial<RState> => ({
    rdfGraphSeed: seed,
  })
}
