import { graph, parse } from 'rdflib'
import { type RReducer, type RState } from '..'
import { newTabID } from './tab'
import { newRDFDriver } from './rdf'
import { defaultLayout } from '../../../../lib/drivers/impl'
import { newNamespaceMap } from './ns'

export function setStoreLoading(): Partial<RState> {
  return { loadStage: 'loading' }
}

export function loadRDF(file: File): RReducer {
  return async (): Promise<Partial<RState> | null> => {
    try {
      const source = await file.text()
      return newStoreState(source, file.name)
    } catch (error: unknown) {
      return {
        loadStage: { error },
      }
    }
  }
}

export function newStoreState(text: string, filename: string): RState {
  const format = 'application/rdf+xml'
  const base = 'file://' + (filename !== '' ? filename : 'upload.xml') // TODO: allow user to set this

  // parse in the graph
  const store = graph()
  parse(text, store, base, format)

  return {
    activeTab: newTabID(),
    loadStage: true,
    filename,
    store,

    ns: newNamespaceMap(store),
    namespaceVersion: 0,

    rdfGraphDriver: newRDFDriver(),
    rdfGraphLayout: defaultLayout,
  }
}
