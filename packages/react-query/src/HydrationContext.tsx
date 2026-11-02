/**
 * Hydration Snapshot Context
 * 
 * Transports the immutable server-side snapshot of query states
 * from HydrationBoundary to useBaseQuery for useSyncExternalStore's
 * getServerSnapshot parameter.
 * 
 * This fixes hydration mismatches by ensuring the exact same data
 * is returned during SSR and initial client render.
 */

'use client'
import * as React from 'react'
import type { DehydratedState } from '@tanstack/query-core'

// Snapshot layer for nested HydrationBoundary support
export interface HydrationSnapshotLayer {
  queries: Map<string, {
    state: any
    data: unknown
    promise?: Promise<unknown>
  }>
  parent?: HydrationSnapshotLayer
}

export const HydrationSnapshotContext = React.createContext<HydrationSnapshotLayer | undefined>(undefined)

/**
 * Creates a new snapshot layer by combining parent snapshot with new dehydrated state
 */
export function createSnapshotLayer(
  parentSnapshot: HydrationSnapshotLayer | undefined,
  dehydratedState: DehydratedState | undefined,
  queryClient: any
): HydrationSnapshotLayer {
  const queries = new Map<string, {
    state: any
    data: unknown
    promise?: Promise<unknown>
  }>()

  if (dehydratedState?.queries) {
    for (const query of dehydratedState.queries) {
      queries.set(query.queryHash, {
        state: query.state,
        data: query.state.data,
        promise: query.promise,
      })
    }
  }

  return {
    queries,
    parent: parentSnapshot,
  }
}

/**
 * Gets the server snapshot for a specific query hash
 * Searches through the snapshot layers (for nested boundaries)
 */
export function getServerSnapshot(
  snapshotLayer: HydrationSnapshotLayer | undefined,
  queryHash: string
): { state: any; data: unknown } | undefined {
  let currentLayer: HydrationSnapshotLayer | undefined = snapshotLayer
  
  while (currentLayer) {
    const snapshot = currentLayer.queries.get(queryHash)
    if (snapshot) {
      return {
        state: snapshot.state,
        data: snapshot.data,
      }
    }
    currentLayer = currentLayer.parent
  }
  
  return undefined
}

/**
 * Hook to access the current hydration snapshot
 */
export function useHydrationSnapshot(): HydrationSnapshotLayer | undefined {
  return React.useContext(HydrationSnapshotContext)
}