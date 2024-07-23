import { type JSX } from 'preact'
import { closeModal } from './state/reducers'
import { useInspectorStore } from './state'
import { setActiveTab } from './state/reducers/tab'
import Tabs, { Label, Tab } from '../../components/tabs'

import DebugTab from './tabs/debug'
import { LazyLoaded } from '../../components/spinner'
import Banner from '../../components/layout/banner'
import { useCallback } from 'preact/hooks'

const PathbuilderTab = LazyLoaded(
  async () => (await import('./tabs/pathbuilder')).default,
)
const TreeTab = LazyLoaded(async () => (await import('./tabs/tree')).default)
const BundleGraphTab = LazyLoaded(
  async () => (await import('./tabs/bundle')).default,
)
const ModelGraphTab = LazyLoaded(
  async () => (await import('./tabs/model')).default,
)
const MapTab = LazyLoaded(async () => (await import('./tabs/map')).default)
const AboutTab = LazyLoaded(async () => (await import('./tabs/about')).default)

export default function InspectorApp(): JSX.Element {
  const apply = useInspectorStore(s => s.apply)
  const activeTab = useInspectorStore(s => s.activeTab)
  const loadStage = useInspectorStore(s => s.loadStage)
  const showModal = useInspectorStore(s => s.showModal)

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
          <b>Supreme Inspector for Pathbuilders</b>
        </Label>

        <Tab title='Pathbuilder' id=''>
          <PathbuilderTab />
        </Tab>
        <Tab title='Tree' disabled={!loaded} id='tree'>
          <TreeTab />
        </Tab>
        <Tab title='Bundle Graph' disabled={!loaded} id='bundle'>
          <BundleGraphTab />
        </Tab>
        <Tab title='Model Graph' disabled={!loaded} id='model'>
          <ModelGraphTab />
        </Tab>
        <Tab title='Namespace Map &#9881;&#65039;' disabled={!loaded} id='ns'>
          <MapTab />
        </Tab>
        <Tab title='About' id='about'>
          <AboutTab />
        </Tab>
        {import.meta.env.DEV && (
          <Tab title='Debug' id='debug'>
            <DebugTab />
          </Tab>
        )}
      </Tabs>
    </>
  )
}
