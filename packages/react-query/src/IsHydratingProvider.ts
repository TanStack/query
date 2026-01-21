'use client'
import * as React from 'react'

const IsHydratingContext = React.createContext<{ current: Set<string> }>({
  current: new Set(),
})

export const useIsHydrating = () => React.useContext(IsHydratingContext)
export const IsHydratingProvider = IsHydratingContext.Provider
