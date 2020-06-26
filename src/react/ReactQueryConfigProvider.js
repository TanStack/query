import React from 'react'
import { DEFAULT_CONFIG, defaultConfigRef } from '../core/config'

//

const configContext = React.createContext()

export function useConfigContext() {
  return React.useContext(configContext) || defaultConfigRef.current
}

export function ReactQueryConfigProvider({ config, children }) {
  let configContextValue = useConfigContext()

  const newConfig = React.useMemo(() => {
    const { shared = {}, queries = {}, mutations = {} } = config
    const {
      shared: contextShared = {},
      queries: contextQueries = {},
      mutations: contextMutations = {},
    } = configContextValue

    return {
      shared: {
        ...contextShared,
        ...shared,
      },
      queries: {
        ...contextQueries,
        ...queries,
      },
      mutations: {
        ...contextMutations,
        ...mutations,
      },
    }
  }, [config, configContextValue])

  React.useEffect(() => {
    // restore previous config on unmount
    return () => {
      defaultConfigRef.current = { ...(configContextValue || DEFAULT_CONFIG) }
    }
  }, [configContextValue])

  if (!configContextValue) {
    defaultConfigRef.current = newConfig
  }

  return (
    <configContext.Provider value={newConfig}>
      {children}
    </configContext.Provider>
  )
}
