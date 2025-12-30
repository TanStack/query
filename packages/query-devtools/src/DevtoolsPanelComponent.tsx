import { createLocalStorage } from '@solid-primitives/storage'
import { createMemo, createSignal } from 'solid-js'
import { ContentView, ParentPanel } from './Devtools'
import { getPreferredColorScheme } from './utils'
import { THEME_PREFERENCE } from './constants'
import { DevtoolsStateContext, PiPProvider, QueryDevtoolsContext, ThemeContext } from './contexts'
import type { Theme, QueryCacheMap, MutationCacheMap } from './contexts'
import type { DevtoolsComponentType } from './Devtools'

const DevtoolsPanelComponent: DevtoolsComponentType = (props) => {
  const [localStore, setLocalStore] = createLocalStorage({
    prefix: 'TanstackQueryDevtools',
  })

  const [selectedQueryHash, setSelectedQueryHash] = createSignal<string | null>(null)
  const [selectedMutationId, setSelectedMutationId] = createSignal<number | null>(null)
  const [panelWidth, setPanelWidth] = createSignal(0)
  const [offline, setOffline] = createSignal(false)
  const queryCacheMap: QueryCacheMap = new Map()
  const mutationCacheMap: MutationCacheMap = new Map()

  const colorScheme = getPreferredColorScheme()

  const theme = createMemo(() => {
    const preference = (props.theme ||
      localStore.theme_preference ||
      THEME_PREFERENCE) as Theme
    if (preference !== 'system') return preference
    return colorScheme()
  })

  return (
    <QueryDevtoolsContext.Provider value={props}>
      <DevtoolsStateContext.Provider value={{
        selectedQueryHash, setSelectedQueryHash,
        selectedMutationId, setSelectedMutationId,
        panelWidth, setPanelWidth,
        offline, setOffline,
        queryCacheMap, mutationCacheMap,
      }}>
        <PiPProvider
          disabled
          localStore={localStore}
          setLocalStore={setLocalStore}
        >
          <ThemeContext.Provider value={theme}>
            <ParentPanel>
              <ContentView
                localStore={localStore}
                setLocalStore={setLocalStore}
                onClose={props.onClose}
                showPanelViewOnly
              />
            </ParentPanel>
          </ThemeContext.Provider>
        </PiPProvider>
      </DevtoolsStateContext.Provider>
    </QueryDevtoolsContext.Provider>
  )
}

export default DevtoolsPanelComponent
