// ❌ fails: the routes array is imported from ./routes.tsx, so the route that isn't prefetched there
// is reported here, at the routes passed to `createBrowserRouter`.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { adminRoutes } from './routes'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60 * 1000 } },
})

// eslint-disable-next-line @tanstack/query-prefetch/require-prefetch -- The query 'userOptions(userId)' used by 'useSuspenseQuery' in './routes.tsx' isn't prefetched in this route's loader, so it only starts fetching after the component renders. Start it in this route's loader by passing the same query options to 'queryClient.query()'.
const router = createBrowserRouter(adminRoutes)

const rootElement = document.getElementById('admin-root')
if (!rootElement) throw new Error('Missing #admin-root element')

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
