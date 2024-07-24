import { type JSX } from 'preact'
import useRDFStore from './state'
import Tabs, { Label, Tab } from '../../components/tabs'
import { LazyLoaded } from '../../components/spinner'
import Banner from '../../components/layout/banner'
import useEventCallback from '../../components/hooks/event'

const RDFTab = LazyLoaded(async () => (await import('./tabs/rdf')).default)
const MapTab = LazyLoaded(async () => (await import('./tabs/map')).default)
const GraphTab = LazyLoaded(async () => (await import('./tabs/graph')).default)
const DocsTab = LazyLoaded(async () => (await import('./tabs/docs')).default)
const AboutTab = LazyLoaded(async () => (await import('./tabs/about')).default)

export default function RDFViewerApp(): JSX.Element {
  const activeTab = useRDFStore(s => s.activeTab)
  const setActiveTab = useRDFStore(s => s.setActiveTab)

  const modal = useRDFStore(s => s.modal)
  const closeModal = useRDFStore(s => s.hideModal)
  const handleCloseModal = useEventCallback(closeModal)

  const loadStage = useRDFStore(s => s.loadStage)
  const loaded = loadStage === true

  return (
    <>
      {modal && <Banner onClose={handleCloseModal} />}
      <Tabs onChangeTab={setActiveTab} active={activeTab}>
        <Label>
          <b>RDF Viewer</b>
        </Label>
        <Tab title='RDF File' id=''>
          <RDFTab />
        </Tab>
        <Tab title='Graph' disabled={!loaded} id='graph'>
          <GraphTab />
        </Tab>
        <Tab title='Namespace Map &#9881;&#65039;' disabled={!loaded} id='ns'>
          <MapTab />
        </Tab>
        <Tab title='Docs' id='docs'>
          <DocsTab />
        </Tab>
        <Tab title='About' id='about'>
          <AboutTab />
        </Tab>
      </Tabs>
    </>
  )
}
