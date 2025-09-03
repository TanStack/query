import { createLocalStorage } from '@solid-primitives/storage'
import { createMemo } from 'solid-js'
import { Devtools } from './Devtools'
import { getPreferredColorScheme } from './utils'
import { THEME_PREFERENCE } from './constants'
import { PiPProvider, QueryDevtoolsContext, ThemeContext } from './contexts'
import type { DevtoolsComponentType } from './Devtools'

const DevtoolsComponent: DevtoolsComponentType = (props) => {
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

export default DevtoolsComponent
