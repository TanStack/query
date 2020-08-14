import React from 'react'

import { mergeReactQueryConfigs } from '../core/config'
import { ReactQueryConfig } from '../core/types'

const configContext = React.createContext<ReactQueryConfig | undefined>(
  undefined
)

export function useContextConfig() {
  return React.useContext(configContext)
}

export interface ReactQueryConfigProviderProps {
  config: ReactQueryConfig
}

export const ReactQueryConfigProvider: React.FC<ReactQueryConfigProviderProps> = ({
  config,
  children,
}) => {
  const parentConfig = useContextConfig()

  const mergedConfig = React.useMemo(
    () =>
      parentConfig ? mergeReactQueryConfigs(parentConfig, config) : config,
    [config, parentConfig]
  )

  return (
    <configContext.Provider value={mergedConfig}>
      {children}
    </configContext.Provider>
  )
}
