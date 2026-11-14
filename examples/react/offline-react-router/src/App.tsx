import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { MutationCache, QueryClient } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { toast } from 'react-hot-toast'
import { createBrowserRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import Detail, { loader as detailLoader } from './routes/detail'
import List from './routes/list'
import Root from './routes/root'
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

let isRestoring = true

const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
    children: [
      {
        index: true,
        element: <List />,
      },
      {
        path: ':movieId',
        element: <Detail />,
        loader: detailLoader(queryClient, () => isRestoring),
      },
    ],
  },
])

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
      <RouterProvider router={router} />
      <ReactQueryDevtools initialIsOpen />
    </PersistQueryClientProvider>
  )
}
