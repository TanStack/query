/* @refresh reload */
import { render } from 'solid-js/web'
import { RouterProvider, createRouter } from '@tanstack/solid-router'
import { QueryClientProvider } from '@tanstack/solid-query'
import { SolidQueryDevtools } from '@tanstack/solid-query-devtools'

import './index.css'

import ErrorPage from './error-page'
import { queryClient } from './queryClient'
import { routeTree } from './routeTree.gen'

const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
  defaultErrorComponent: (props) => <ErrorPage error={props.error} />,
  defaultNotFoundComponent: () => <ErrorPage error={new Error('Not Found')} />,
})

declare module '@tanstack/solid-router' {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Missing #root element')
render(
  () => (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <SolidQueryDevtools buttonPosition="bottom-right" />
    </QueryClientProvider>
  ),
  rootElement,
)
