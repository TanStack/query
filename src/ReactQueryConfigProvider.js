import React from 'react'

//

import { configContext, defaultConfigRef } from './utils'

export function ReactQueryConfigProvider({ config, children }) {
  let configContextValue = React.useContext(configContext)

  const newConfig = React.useMemo(() => {
    const newConfig = {
      ...(configContextValue || defaultConfigRef.current),
      ...config,
    }

    // Default useErrorBoundary to the suspense value
    if (typeof newConfig.useErrorBoundary === 'undefined') {
      newConfig.useErrorBoundary = newConfig.suspense
    }

    return newConfig
  }, [config, configContextValue])

  if (!configContextValue) {
    defaultConfigRef.current = newConfig
  }

  return (
    <configContext.Provider value={newConfig}>
      {children}
    </configContext.Provider>
  )
}
