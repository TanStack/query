import { useState } from 'preact/hooks'
import {
  MutationCache,
  QueryClient,
  noop,
  onlineManager,
  useIsRestoring,
  useMutation,
  useQuery,
} from '@tanstack/preact-query'
import { PreactQueryDevtools } from '@tanstack/preact-query-devtools'
import { PersistQueryClientProvider } from '@tanstack/preact-query-persist-client'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { LocationProvider, Route, Router, useRoute } from 'preact-iso'

import { moviesMutations, moviesQueries } from './services/movies/queries'
import { Toaster, toaster } from './Toaster'

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
      toaster.error({ title: error.message })
    },
  }),
})

// we need a default mutation function so that paused mutations can resume after a page reload
queryClient.setMutationDefaults(moviesQueries.all(), {
  ...moviesMutations.update(),
  onSuccess: (data) => {
    toaster.success({ title: data.message })
  },
})

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
      <LocationProvider>
        <Router>
          <Route path="/" component={List} />
          <Route path="/:movieId" component={Detail} />
        </Router>
      </LocationProvider>
      <Toaster />
      <PreactQueryDevtools initialIsOpen />
    </PersistQueryClientProvider>
  )
}

function List() {
  const isRestoring = useIsRestoring()
  const moviesQuery = useQuery(moviesQueries.list())

  if (moviesQuery.isLoading) {
    return 'Loading...'
  }

  if (moviesQuery.data) {
    return (
      <div>
        <h1>Movies</h1>
        <p>
          Try to mock offline behavior with the button in the devtools. You can
          navigate around as long as there is already data in the cache. You'll
          get a refetch as soon as you go online again.
        </p>
        <ul>
          {moviesQuery.data.movies.map((movie) => (
            <li key={movie.id}>
              <a
                href={`/${movie.id}`}
                onMouseEnter={() => {
                  // do not prefetch if we are offline or hydrating because it returns a promise that is pending until we go online again
                  // we just let the Detail component handle it
                  if (onlineManager.isOnline() && !isRestoring) {
                    queryClient
                      .query(moviesQueries.detail(movie.id))
                      .catch(noop)
                  }
                }}
              >
                {movie.title}
              </a>
            </li>
          ))}
        </ul>
        <div>
          Updated at: {new Date(moviesQuery.data.ts).toLocaleTimeString()}
        </div>
        <div>{moviesQuery.isFetching && 'fetching...'}</div>
      </div>
    )
  }

  if (moviesQuery.isError) {
    return (
      <div>
        <h1>Couldn't load movies!</h1>
        <div>{moviesQuery.error.message}</div>
      </div>
    )
  }

  // query will be in 'idle' fetchStatus while restoring from localStorage
  return null
}

function Detail() {
  const { movieId } = useRoute().params
  const movieQuery = useQuery(moviesQueries.detail(movieId))

  const [commentDraft, setCommentDraft] = useState<string | undefined>()

  const updateMovie = useMutation({
    ...moviesMutations.update(),
    mutationKey: moviesQueries.detail(movieId).queryKey,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({
        queryKey: moviesQueries.detail(movieId).queryKey,
      })
      const { queryKey } = moviesQueries.detail(movieId)
      const previousData = queryClient.getQueryData(queryKey)

      // remove local state so that server state is taken instead
      setCommentDraft(undefined)

      queryClient.setQueryData(
        queryKey,
        (old) =>
          old && {
            ...old,
            movie: {
              ...old.movie,
              comment: variables.comment,
            },
          },
      )

      return { previousData }
    },
    onError: (_, __, onMutateResult) => {
      queryClient.setQueryData(
        moviesQueries.detail(movieId).queryKey,
        onMutateResult?.previousData,
      )
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: moviesQueries.detail(movieId).queryKey,
      })
    },
  })

  const comment = commentDraft ?? movieQuery.data?.movie.comment

  if (movieQuery.isLoading) {
    return 'Loading...'
  }

  function submitForm(event: SubmitEvent) {
    event.preventDefault()

    if (comment === undefined) {
      return
    }

    updateMovie.mutate({
      id: movieId,
      comment,
    })
  }

  if (movieQuery.data) {
    return (
      <form onSubmit={submitForm}>
        <a href="/">Back</a>
        <h1>Movie: {movieQuery.data.movie.title}</h1>
        <p>
          Try to mock offline behavior with the button in the devtools, then
          update the comment. The optimistic update will succeed, but the actual
          mutation will be paused and resumed once you go online again.
        </p>
        <p>
          You can also reload the page, which will make the persisted mutation
          resume, as you will be online again when you "come back".
        </p>
        <p>
          <label>
            Comment: <br />
            <textarea
              name="comment"
              value={comment}
              onInput={(event) => setCommentDraft(event.currentTarget.value)}
            />
          </label>
        </p>
        <button type="submit">Submit</button>
        <div>
          Updated at: {new Date(movieQuery.data.ts).toLocaleTimeString()}
        </div>
        <div>{movieQuery.isFetching && 'fetching...'}</div>
        <div>
          {updateMovie.isPaused
            ? 'mutation paused - offline'
            : updateMovie.isPending && 'updating...'}
        </div>
      </form>
    )
  }

  if (movieQuery.isError) {
    return (
      <div>
        <a href="/">Back</a>
        <h1>Couldn't load movie!</h1>
        <div>{movieQuery.error.message}</div>
      </div>
    )
  }

  if (movieQuery.isPaused) {
    return "We're offline and have no data to show :("
  }

  return null
}
