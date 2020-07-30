import React from 'react'

import { DEFAULT_CONFIG, defaultConfigRef } from '../core/config'
import { ReactQueryConfig } from '../core/types'

const configContext = React.createContext<ReactQueryConfig | undefined>(
  undefined
)

export function useConfigContext() {
  return React.useContext(configContext) || defaultConfigRef.current
}

export interface ReactQueryProviderConfig extends ReactQueryConfig {}

export interface ReactQueryConfigProviderProps {
  config: ReactQueryProviderConfig
}

export const ReactQueryConfigProvider: React.FC<ReactQueryConfigProviderProps> = ({
  config,
  children,
}) => {
  const configContextValueOrDefault = useConfigContext()
  const configContextValue = React.useContext(configContext)

  const newConfig = React.useMemo<ReactQueryConfig>(() => {
    const { shared = {}, queries = {}, mutations = {} } = config
    const {
      shared: contextShared = {},
      queries: contextQueries = {},
      mutations: contextMutations = {},
    } = configContextValueOrDefault

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
  }, [config, configContextValueOrDefault])

  React.useEffect(() => {
    // restore previous config on unmount
    return () => {
      defaultConfigRef.current = {
        ...(configContextValueOrDefault || DEFAULT_CONFIG),
      }
    }
  }, [configContextValueOrDefault])

  // If this is the outermost provider, overwrite the shared default config
  if (!configContextValue) {
    defaultConfigRef.current = newConfig
  }

  return (
    <configContext.Provider value={newConfig}>
      {children}
    </configContext.Provider>
  )
}
