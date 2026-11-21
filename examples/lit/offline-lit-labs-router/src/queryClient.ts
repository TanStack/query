import { MutationCache, QueryClient } from '@tanstack/lit-query'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { moviesMutations, moviesQueries } from './services/movies/queries'
import { toast } from './toast'

export const persister = createAsyncStoragePersister({
  storage: window.localStorage,
})

export const queryClient = new QueryClient({
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
