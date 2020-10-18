import React from 'react'

import { Environment } from '../core'

const EnvironmentContext = React.createContext<Environment | undefined>(
  undefined
)

export const useEnvironment = () => React.useContext(EnvironmentContext)!

export interface EnvironmentProviderProps {
  environment: Environment
}

export const EnvironmentProvider: React.FC<EnvironmentProviderProps> = ({
  environment,
  children,
}) => {
  React.useEffect(() => {
    environment.mount()
    return () => {
      environment.unmount()
    }
  }, [environment])

  return (
    <EnvironmentContext.Provider value={environment}>
      {children}
    </EnvironmentContext.Provider>
  )
}
