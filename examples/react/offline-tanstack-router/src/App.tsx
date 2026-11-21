import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import {
  MutationCache,
  QueryClient,
  useIsRestoring,
} from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { toast } from 'react-hot-toast'
import { routeTree } from './routeTree.gen'
import { moviesMutations, moviesQueries } from './services/movies/queries'

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
  // configure global cache callbacks to show error toast notifications
  mutationCache: new MutationCache({
    onError: (error) => {
      toast.error(error.message)
    },
  }),
})

// we need a default mutation function so that paused mutations can resume after a page reload
queryClient.setMutationDefaults(moviesQueries.all(), {
  ...moviesMutations.update(),
  onSuccess: (data) => {
    toast.success(data.message)
  },
})

const router = createRouter({
  routeTree,
  context: { queryClient, isRestoring: true },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
})

declare module '@tanstack/react-router' {
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
      <ReactQueryDevtools initialIsOpen />
    </PersistQueryClientProvider>
  )
}

function Movies() {
  const isRestoring = useIsRestoring()
  return <RouterProvider router={router} context={{ isRestoring }} />
}
