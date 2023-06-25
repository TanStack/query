'use client'

import type { DehydratedState, QueryClient } from '@tanstack/react-query'
import { dehydrate, hydrate, useQueryClient } from '@tanstack/react-query'
import * as React from 'react'
import type { HydrationStreamProviderProps } from './HydrationStreamProvider'
import { createHydrationStreamProvider } from './HydrationStreamProvider'

const stream = createHydrationStreamProvider<DehydratedState>()

/**
 * This component is responsible for:
 * - hydrating the query client on the server
 * - dehydrating the query client on the server
 */
export function ReactQueryStreamedHydration(props: {
  children: React.ReactNode
  queryClient?: QueryClient
  transformer?: HydrationStreamProviderProps<DehydratedState>['transformer']
}) {
  const queryClient = useQueryClient(props.queryClient)

  /**
   * We need to track which queries were added/updated during the render
   */
  const [trackedKeys] = React.useState(() => new Set<string>())

  // <server only>
  if (typeof window === 'undefined') {
    // Do we need to care about unsubscribing? I don't think so to be honest
    queryClient.getQueryCache().subscribe((event) => {
      switch (event.type) {
        case 'added':
        case 'updated':
          // console.log('tracking', event.query.queryHash, 'b/c of a', event.type)
          trackedKeys.add(event.query.queryHash)
      }
    })
  }
  // </server only>

  return (
    <stream.Provider
      // Happens on server:
      onFlush={() => {
        /**
         * Dehydrated state of the client where we only include the queries that were added/updated since the last flush
         */
        const dehydratedState = dehydrate(queryClient, {
          shouldDehydrateQuery(query) {
            return (
              trackedKeys.has(query.queryHash) &&
              query.state.status !== 'pending'
            )
          },
        })
        trackedKeys.clear()

        if (!dehydratedState.queries.length) {
          return []
        }

        return [dehydratedState]
      }}
      // Happens in browser:
      onEntries={(entries) => {
        for (const hydratedState of entries) {
          hydrate(queryClient, hydratedState)
        }
      }}
      // Handle BigInts etc using superjson
      transformer={props.transformer}
    >
      {props.children}
    </stream.Provider>
  )
}
