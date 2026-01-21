'use client'
import * as React from 'react'

// Mutable set of query hashes that are pending hydration
// Using a ref-like object so we can mutate it without re-rendering
interface HydratingQueriesRef {
  current: Set<string>
}

const defaultRef: HydratingQueriesRef = { current: new Set() }

const IsHydratingContext = React.createContext<HydratingQueriesRef>(defaultRef)

export const useIsHydrating = () => React.useContext(IsHydratingContext)
export const IsHydratingProvider = IsHydratingContext.Provider
