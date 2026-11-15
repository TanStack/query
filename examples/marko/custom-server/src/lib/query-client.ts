import { QueryClient } from '@tanstack/marko-query'

// Creates every client of the app: one per request on the server and one per
// page in the browser. Handed to `<query-client-factory>` in the layout tag.
export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
      },
    },
  })
