import { MutationCache, QueryClient } from '@tanstack/solid-query'
import { SolidQueryDevtools } from '@tanstack/solid-query-devtools'
import { PersistQueryClientProvider } from '@tanstack/solid-query-persist-client'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { Route, Router } from '@solidjs/router'

import { moviesMutations, moviesQueries } from './services/movies/queries'
import List from './routes/list'
import Detail, { preload as detailPreload } from './routes/detail'

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

let isRestoring = true

export default function App() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}
      onSuccess={() => {
        isRestoring = false
        // resume mutations after initial restore from localStorage was successful
        queryClient.resumePausedMutations().then(() => {
          queryClient.invalidateQueries()
        })
      }}
      onError={() => {
        isRestoring = false
      }}
    >
      <Router>
        <Route path="/" component={List} />
        <Route
          path="/:movieId"
          component={Detail}
          preload={detailPreload(queryClient, () => isRestoring)}
        />
      </Router>
      <SolidQueryDevtools initialIsOpen />
    </PersistQueryClientProvider>
  )
}
