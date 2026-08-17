import { createContext, useContext } from 'octane'
import type { QueryClient } from '@tanstack/query-core'

// The QueryClient context — read by useQuery/useMutation/useQueryClient. Mirrors
// react-query's QueryClientContext.
export const QueryClientContext = createContext<QueryClient | undefined>(
  undefined,
)

// Resolve the client: an explicitly-passed one wins, else the context value.
// `useContext` is keyed by context identity (not a per-call-site slot), so it's
// safe to call from this binding code without a compiler-injected slot.
export function resolveClient(
  queryClient: QueryClient | undefined,
): QueryClient {
  const ctxClient = useContext(QueryClientContext)
  const client = queryClient ?? ctxClient
  if (!client) {
    throw new Error('No QueryClient set, use QueryClientProvider to set one')
  }
  return client
}

// Signature matches @tanstack/react-query's QueryClientProvider.tsx.
export function useQueryClient(queryClient?: QueryClient): QueryClient

export function useQueryClient(...args: Array<unknown>): QueryClient {
  // Args are `[queryClient?, slot?]`; the slot (symbol) is appended by the
  // compiler. An explicit client is the first non-symbol arg.
  const queryClient =
    args.length && typeof args[0] !== 'symbol'
      ? (args[0] as QueryClient)
      : undefined
  return resolveClient(queryClient)
}
