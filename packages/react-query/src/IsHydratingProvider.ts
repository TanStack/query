'use client'
import * as React from 'react'

const IsHydratingContext = React.createContext<ReadonlySet<string>>(new Set())

/**
 * Returns the hashes of the queries whose dehydrated data a `HydrationBoundary` is still waiting to hydrate.
 * `useQuery` and friends check this internally, so that a query pending hydration doesn't refetch on mount.
 * @returns The hashes of the queries pending hydration, or an empty set outside a `HydrationBoundary`.
 */
export const useIsHydrating = () => React.useContext(IsHydratingContext)

/**
 * The Provider that `HydrationBoundary` uses to share the hashes of the queries pending hydration, read by
 * `useIsHydrating`.
 */
export const IsHydratingProvider = IsHydratingContext.Provider
