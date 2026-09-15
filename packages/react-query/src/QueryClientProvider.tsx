'use client'
import * as React from 'react'

import { QueryCache, QueryClient } from '@tanstack/query-core'
import type { DehydratedState, HydrateOptions } from '@tanstack/query-core'

/**
 * The context that `useQueryClient` reads from. `QueryClientProvider` is the normal way to set it.
 */
export const QueryClientContext = React.createContext<QueryClient | undefined>(
  undefined,
)

/**
 * Internal context that carries the frozen server snapshot used during hydration. The value is a
 * throwaway `QueryClient` whose cache holds the exact query state that produced the server markup,
 * so hooks can replay it instead of reading newer live cache data. `undefined` outside of SSR
 * hydration (i.e. on the server without a provided snapshot, or after hydration).
 */
export const QueryServerSnapshotContext = React.createContext<
  QueryClient | undefined
>(undefined)

/**
 * The `useQueryClient` hook returns the current `QueryClient` instance.
 *
 * @param queryClient - Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will
 * be used.
 * @returns The current `QueryClient` instance.
 * @throws If no `queryClient` argument is passed and no `QueryClientProvider` is found in the component tree.
 */
export const useQueryClient = (queryClient?: QueryClient) => {
  const client = React.useContext(QueryClientContext)

  if (queryClient) {
    return queryClient
  }

  if (!client) {
    throw new Error('No QueryClient set, use QueryClientProvider to set one')
  }

  return client
}

/**
 * The props accepted by `QueryClientProvider`.
 */
export type QueryClientProviderProps = {
  /**
   * **Required**
   *
   * The `QueryClient` instance to provide.
   */
  client: QueryClient
  /**
   * Optional frozen snapshot of the query state that produced the server-rendered markup. When
   * provided, hooks replay this state during hydration (via `useSyncExternalStore`'s server
   * snapshot) before switching to the live cache, so the first client render matches the server
   * output even if the live cache already advanced (e.g. a streamed promise resolved before
   * hydration).
   *
   * Typically this is the same `DehydratedState` that was passed to `hydrate`/`HydrationBoundary`.
   * Passing the server state here mirrors React Redux's `Provider serverState` API.
   */
  serverSnapshot?: DehydratedState | null
  /**
   * Options used to deserialize `serverSnapshot`. Pass the same options supplied to `hydrate` or
   * `HydrationBoundary`. When omitted, the client's default hydration options are used.
   */
  serverSnapshotOptions?: HydrateOptions
  /**
   * The components that get access to the provided `QueryClient`.
   */
  children?: React.ReactNode
}

/**
 * Use the `QueryClientProvider` component to connect and provide a `QueryClient` to your application. Also
 * calls `client.mount()`/`client.unmount()` as this component mounts/unmounts, which subscribes the client to
 * focus/online events (resuming any paused mutations and refetching as needed when the app regains focus or
 * comes back online).
 *
 * @returns The provided `children`, wrapped so they can read the `QueryClient` via `useQueryClient`.
 *
 * @example
 * ```tsx
 * import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
 *
 * const queryClient = new QueryClient()
 *
 * function App() {
 *   return <QueryClientProvider client={queryClient}>...</QueryClientProvider>
 * }
 * ```
 */
export const QueryClientProvider = ({
  client,
  children,
  serverSnapshot,
  serverSnapshotOptions,
}: QueryClientProviderProps): React.JSX.Element => {
  React.useEffect(() => {
    client.mount()
    return () => {
      client.unmount()
    }
  }, [client])

  // A throwaway client whose cache holds the server-rendered query state. We build queries directly
  // from the dehydrated state (rather than calling `hydrate`) so the frozen `fetchStatus` is
  // preserved and hooks replay exactly what the server rendered.
  const snapshotClient = React.useMemo(() => {
    if (!serverSnapshot) {
      return undefined
    }

    const queryCache = new QueryCache()
    const frozenClient = new QueryClient({ queryCache })
    const deserializeData =
      serverSnapshotOptions?.defaultOptions?.deserializeData ??
      client.getDefaultOptions().hydrate?.deserializeData

    serverSnapshot.queries.forEach(({ queryKey, queryHash, state, meta }) => {
      const data =
        state.data === undefined || !deserializeData
          ? state.data
          : deserializeData(state.data)

      queryCache.build(
        frozenClient,
        { queryKey, queryHash, meta },
        // Build from a copy so the caller's dehydrated state is never mutated.
        { ...state, data },
      )
    })

    return frozenClient
  }, [client, serverSnapshot, serverSnapshotOptions])

  return (
    <QueryClientContext.Provider value={client}>
      <QueryServerSnapshotContext.Provider value={snapshotClient}>
        {children}
      </QueryServerSnapshotContext.Provider>
    </QueryClientContext.Provider>
  )
}
