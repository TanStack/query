import { I18nProvider } from '@kobalte/core'
import { createLocalStorage } from '@solid-primitives/storage'
import { createMemo } from 'solid-js'
import { ContentView, ParentPanel } from './Devtools'
import { THEME_PREFERENCE } from './constants'
import { PiPProvider, QueryDevtoolsContext, ThemeContext } from './contexts'
import { DevtoolsOfflineProvider } from './providers/DevtoolsOfflineProvider'
import { DevtoolsStateProvider } from './providers/DevtoolsStateProvider'
import { DevtoolsSubscriptionsProvider } from './providers/DevtoolsSubscriptionsProvider'
import { getPreferredColorScheme } from './utils'
import type { DevtoolsComponentType } from './Devtools'
import type { Theme } from './contexts'

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
        <DevtoolsOfflineProvider>
          <DevtoolsSubscriptionsProvider>
            <PiPProvider
              disabled
              localStore={localStore}
              setLocalStore={setLocalStore}
            >
              <ThemeContext.Provider value={theme}>
                <I18nProvider locale="en-US">
                  <ParentPanel>
                    <ContentView
                      localStore={localStore}
                      setLocalStore={setLocalStore}
                      onClose={props.onClose}
                      showPanelViewOnly
                    />
                  </ParentPanel>
                </I18nProvider>
              </ThemeContext.Provider>
            </PiPProvider>
          </DevtoolsSubscriptionsProvider>
        </DevtoolsOfflineProvider>
      </DevtoolsStateProvider>
    </QueryDevtoolsContext.Provider>
  )
}

export default DevtoolsPanelComponent
