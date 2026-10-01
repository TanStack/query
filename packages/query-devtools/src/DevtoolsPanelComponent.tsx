import { createLocalStorage } from '@solid-primitives/storage'
import { createMemo } from 'solid-js'
import { DevtoolsSubscriptionsProvider } from './contexts/DevtoolsSubscriptionsContext'
import { DevtoolsStateProvider } from './contexts/DevtoolsStateContext'
import { ContentView, ParentPanel } from './Devtools'
import { getPreferredColorScheme } from './utils'
import { THEME_PREFERENCE } from './constants'
import { PiPProvider, QueryDevtoolsContext, ThemeContext } from './contexts'
import type { Theme } from './contexts'
import type { DevtoolsComponentType } from './Devtools'

const DevtoolsPanelComponent: DevtoolsComponentType = (props) => {
  const [localStore, setLocalStore] = createLocalStorage({
    prefix: 'TanstackQueryDevtools',
  })

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
      <DevtoolsStateProvider>
        <DevtoolsSubscriptionsProvider>
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
        </DevtoolsSubscriptionsProvider>
      </DevtoolsStateProvider>
    </QueryDevtoolsContext.Provider>
  )
}

export default DevtoolsPanelComponent
