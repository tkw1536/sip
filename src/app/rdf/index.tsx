import { type JSX } from 'preact'
import { useRDFStore } from './state'
import { setActiveTab } from './state/reducers/tab'
import Tabs, { Label, Tab } from '../../components/tabs'
import { LazyLoaded } from '../../components/spinner'
import Banner from '../../components/layout/banner'
import { useCallback } from 'preact/hooks'
import { closeModal } from './state/reducers/rdf'

const RDFTab = LazyLoaded(async () => (await import('./tabs/rdf')).default)
const MapTab = LazyLoaded(async () => (await import('./tabs/map')).default)
const GraphTab = LazyLoaded(async () => (await import('./tabs/graph')).default)
const DocsTab = LazyLoaded(async () => (await import('./tabs/docs')).default)
const AboutTab = LazyLoaded(async () => (await import('./tabs/about')).default)

export default function RDFViewerApp(): JSX.Element {
  const apply = useRDFStore(s => s.apply)
  const activeTab = useRDFStore(s => s.activeTab)
  const loadStage = useRDFStore(s => s.loadStage)
  const showModal = useRDFStore(s => s.showModal)

  const loaded = loadStage === true

  const handleChangeTab = useCallback(
    (key: string): void => {
      apply(setActiveTab(key))
    },
    [apply, setActiveTab],
  )
  const handleClose = useCallback(() => {
    apply(closeModal())
  }, [apply, closeModal])

  return (
    <>
      {showModal && <Banner onClose={handleClose} />}
      <Tabs onChangeTab={handleChangeTab} active={activeTab}>
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
