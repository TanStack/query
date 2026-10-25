import * as React from 'react'
import {
  MutationCache,
  QueryClient,
  onlineManager,
  useIsRestoring,
  useMutation,
  useQuery,
} from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster, toast } from 'react-hot-toast'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import {
  Link,
  Outlet,
  ReactLocation,
  Router,
  useMatch,
} from '@tanstack/react-location'

import { moviesMutations, moviesQueries } from './services/movies/queries'

const persister = createAsyncStoragePersister({
  storage: window.localStorage,
})

const location = new ReactLocation()

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
  return (
    <Router
      location={location}
      routes={[
        {
          path: '/',
          element: <List />,
        },
        {
          path: ':movieId',
          element: <Detail />,
          loader: async ({ params: { movieId } }) =>
            queryClient.getQueryData(moviesQueries.detail(movieId).queryKey) ??
            // do not load if we are offline or hydrating because it returns a promise that is pending until we go online again
            // we just let the Detail component handle it
            (onlineManager.isOnline() && !isRestoring
              ? queryClient.query(moviesQueries.detail(movieId))
              : {}),
        },
      ]}
    >
      <Outlet />
      <Toaster />
    </Router>
  )
}

function List() {
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
              <Link to={`./${movie.id}`} preload={1}>
                {movie.title}
              </Link>
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
  const {
    params: { movieId },
  } = useMatch()
  const movieQuery = useQuery(moviesQueries.detail(movieId))

  const [commentDraft, setCommentDraft] = React.useState<string | undefined>()

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

  function submitForm(event: any) {
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
        <Link to="..">Back</Link>
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
              onChange={(event) => setCommentDraft(event.target.value)}
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
        <Link to="..">Back</Link>
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
