import { type RState } from '.'
import { Store } from 'rdflib'
import { newRDFDriver } from './rdf'
import { defaultLayout } from '../../../../lib/drivers/impl'
import { NamespaceMap } from '../../../../lib/pathbuilder/namespace'

export function resetRDFInterface(showModal: boolean): RState {
  return {
    showModal,
    activeTab: '', // the active tab

    loadStage: false, // boolean indicating if file has been loaded, string for error
    filename: '',

    store: new Store(),
    ns: NamespaceMap.empty(),
    namespaceVersion: 0,

    rdfGraphDriver: newRDFDriver(),
    rdfGraphLayout: defaultLayout,
    rdfGraphSeed: null,
  }
}
