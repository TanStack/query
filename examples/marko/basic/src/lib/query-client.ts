import { QueryClient } from '@tanstack/marko-query'

// Creates every client of the app: one per request on the server and one per
// page in the browser. Handed to `<query-client-factory>` in `+layout.marko`.
export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, a staleTime above 0 stops the browser from refetching the
        // data the server just sent.
        staleTime: 30_000,
      },
    },
  })
