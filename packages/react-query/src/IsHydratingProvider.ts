'use client'
import * as React from 'react'

const IsHydratingContext = React.createContext<Set<string>>(new Set())

export const useIsHydrating = () => React.useContext(IsHydratingContext)
export const IsHydratingProvider = IsHydratingContext.Provider
