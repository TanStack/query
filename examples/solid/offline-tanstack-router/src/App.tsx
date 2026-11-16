import {
  MutationCache,
  QueryClient,
  useIsRestoring,
} from '@tanstack/solid-query'
import { SolidQueryDevtools } from '@tanstack/solid-query-devtools'
import { PersistQueryClientProvider } from '@tanstack/solid-query-persist-client'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { RouterProvider, createRouter } from '@tanstack/solid-router'

import { moviesMutations, moviesQueries } from './services/movies/queries'
import { routeTree } from './routeTree.gen'

const persister = createAsyncStoragePersister({
  storage: window.localStorage,
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 24 * 60 * 60 * 1000, // 24 hours
      staleTime: 2000,
      retry: 0,
    },
  },
  // configure global cache callbacks to show error notifications
  mutationCache: new MutationCache({
    onError: (error) => {
      showNotification(error.message, 'error')
    },
  }),
})

// we need a default mutation function so that paused mutations can resume after a page reload
queryClient.setMutationDefaults(moviesQueries.all(), {
  ...moviesMutations.update(),
  onSuccess: (data) => {
    showNotification(data.message, 'success')
  },
})

function showNotification(message: string, type: 'success' | 'error') {
  const el = document.createElement('div')
  el.style.cssText = `
    position: fixed; top: 16px; right: 16px; z-index: 9999;
    padding: 12px 24px; border-radius: 4px; color: white;
    background: ${type === 'success' ? '#22c55e' : '#ef4444'};
    animation: fadeIn 0.3s ease-in;
  `
  el.textContent = message
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 3000)
}

const router = createRouter({
  routeTree,
  context: { queryClient, isRestoring: () => true },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
})

declare module '@tanstack/solid-router' {
  interface Register {
    router: typeof router
  }
}

export default function App() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}
      onSuccess={() => {
        // resume mutations after initial restore from localStorage was successful
        queryClient.resumePausedMutations().then(() => {
          queryClient.invalidateQueries()
        })
      }}
    >
      <Movies />
      <SolidQueryDevtools initialIsOpen />
    </PersistQueryClientProvider>
  )
}

function Movies() {
  const isRestoring = useIsRestoring()
  return <RouterProvider router={router} context={{ isRestoring }} />
}
