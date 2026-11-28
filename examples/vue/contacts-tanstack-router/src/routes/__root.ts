import { query } from '@tanstack/vue-query'
import { createRootRouteWithContext } from '@tanstack/vue-router'
import { contactsQueries } from '../services/contacts/queries'
import type { QueryClient } from '@tanstack/vue-query'

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
    validateSearch: (search: Record<string, unknown>): { q?: string } => ({
      q: typeof search.q === 'string' && search.q ? search.q : undefined,
    }),
    loaderDeps: ({ search: { q } }) => ({ q }),
    loader: ({ context: { queryClient }, deps: { q } }) =>
      query(queryClient, { ...contactsQueries.list(q), staleTime: 'static' }),
  },
)
