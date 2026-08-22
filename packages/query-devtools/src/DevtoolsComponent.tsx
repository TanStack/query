import { createLocalStorage } from '@solid-primitives/storage'
import { createMemo } from 'solid-js'
import { Devtools } from './Devtools'
import { getPreferredColorScheme } from './utils'
import { THEME_PREFERENCE } from './constants'
import {
  DevtoolsUiProvider,
  PiPProvider,
  QueryDevtoolsContext,
  ThemeContext,
} from './contexts'
import type { Theme } from './contexts'
import type { DevtoolsComponentType } from './Devtools'

const DevtoolsComponent: DevtoolsComponentType = (props) => {
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
      <DevtoolsUiProvider>
        <PiPProvider localStore={localStore} setLocalStore={setLocalStore}>
          <ThemeContext.Provider value={theme}>
            <Devtools localStore={localStore} setLocalStore={setLocalStore} />
          </ThemeContext.Provider>
        </PiPProvider>
      </DevtoolsUiProvider>
    </QueryDevtoolsContext.Provider>
  )
}

export default DevtoolsComponent
