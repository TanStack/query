import { createLocalStorage } from '@solid-primitives/storage'
import { createMemo } from 'solid-js'
import { getPreferredColorScheme } from './utils'
import {
  QueryDevtoolsContext,
  QueryDevtoolsProps,
  ThemeContext,
} from './Context'
import { Devtools, PiPProvider, THEME_PREFERENCE } from './Devtools'
import type { Component } from 'solid-js'

export type DevtoolsPanelComponentType = Component<QueryDevtoolsProps> & {
  shadowDOMTarget?: ShadowRoot
}

const DevtoolsPanelComponent: DevtoolsPanelComponentType = (props) => {
  const [localStore, setLocalStore] = createLocalStorage({
    prefix: 'TanstackQueryDevtools',
  })

  const colorScheme = getPreferredColorScheme()

  const theme = createMemo(() => {
    const preference = (localStore.theme_preference || THEME_PREFERENCE) as
      | 'system'
      | 'dark'
      | 'light'
    if (preference !== 'system') return preference
    return colorScheme()
  })

  return (
    <QueryDevtoolsContext.Provider value={props}>
      <PiPProvider localStore={localStore} setLocalStore={setLocalStore}>
        <ThemeContext.Provider value={theme}>
          <Devtools localStore={localStore} setLocalStore={setLocalStore} />
        </ThemeContext.Provider>
      </PiPProvider>
    </QueryDevtoolsContext.Provider>
  )
}
export default DevtoolsPanelComponent
