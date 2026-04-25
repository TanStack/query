import { For, Match, Show, Switch, createSignal } from 'solid-js'
import { MutationCache, QueryClient, useQuery } from '@tanstack/solid-query'
import { SolidQueryDevtools } from '@tanstack/solid-query-devtools'
import { PersistQueryClientProvider } from '@tanstack/solid-query-persist-client'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'

import * as api from './api'
import { movieKeys, useMovie } from './movies'

const persister = createAsyncStoragePersister({
  storage: window.localStorage,
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      staleTime: 2000,
      retry: 0,
    },
  },
  // configure global cache callbacks to show notifications
  mutationCache: new MutationCache({
    onSuccess: (data: any) => {
      showNotification(data.message, 'success')
    },
    onError: (error) => {
      showNotification(error.message, 'error')
    },
  }),
})

// we need a default mutation function so that paused mutations can resume after a page reload
queryClient.setMutationDefaults(movieKeys.all(), {
  mutationFn: async ({ id, comment }: { id: string; comment: string }) => {
    // to avoid clashes with our optimistic update when an offline mutation continues
    await queryClient.cancelQueries({ queryKey: movieKeys.detail(id) })
    return api.updateMovie(id, comment)
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
  const [page, setPage] = createSignal<
    { type: 'list' } | { type: 'detail'; movieId: string }
  >({ type: 'list' })

  return (
    <Switch>
      <Match when={page().type === 'list'}>
        <List
          onSelectMovie={(movieId) => setPage({ type: 'detail', movieId })}
        />
      </Match>
      <Match when={page().type === 'detail'}>
        <Detail
          movieId={(page() as { type: 'detail'; movieId: string }).movieId}
          onBack={() => setPage({ type: 'list' })}
        />
      </Match>
    </Switch>
  )
}

function List(props: { onSelectMovie: (movieId: string) => void }) {
  const moviesQuery = useQuery(() => ({
    queryKey: movieKeys.list(),
    queryFn: api.fetchMovies,
  }))

  return (
    <Switch>
      <Match when={moviesQuery.isLoading}>Loading...</Match>
      <Match when={moviesQuery.data}>
        <div>
          <h1>Movies</h1>
          <p>
            Try to mock offline behavior with the button in the devtools. You
            can navigate around as long as there is already data in the cache.
            You'll get a refetch as soon as you go online again.
          </p>
          <ul>
            <For each={moviesQuery.data!.movies}>
              {(movie) => (
                <li>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      props.onSelectMovie(movie.id)
                    }}
                  >
                    {movie.title}
                  </a>
                </li>
              )}
            </For>
          </ul>
          <div>
            Updated at: {new Date(moviesQuery.data!.ts).toLocaleTimeString()}
          </div>
          <Show when={moviesQuery.isFetching}>
            <div>fetching...</div>
          </Show>
        </div>
      </Match>
    </Switch>
  )
}

function Detail(props: { movieId: string; onBack: () => void }) {
  const { comment, setComment, updateMovie, movieQuery } = useMovie(
    props.movieId,
  )

  function submitForm(event: SubmitEvent) {
    event.preventDefault()

    updateMovie.mutate({
      id: props.movieId,
      comment: comment(),
    })
  }

  return (
    <Switch>
      <Match when={movieQuery.isLoading}>Loading...</Match>
      <Match when={movieQuery.data}>
        <form onSubmit={submitForm}>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              props.onBack()
            }}
          >
            Back
          </a>
          <h1>Movie: {movieQuery.data!.movie.title}</h1>
          <p>
            Try to mock offline behavior with the button in the devtools, then
            update the comment. The optimistic update will succeed, but the
            actual mutation will be paused and resumed once you go online again.
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
                value={comment() ?? ''}
                onInput={(event) => setComment(event.currentTarget.value)}
              />
            </label>
          </p>
          <button type="submit">Submit</button>
          <div>
            Updated at: {new Date(movieQuery.data!.ts).toLocaleTimeString()}
          </div>
          <Show when={movieQuery.isFetching}>
            <div>fetching...</div>
          </Show>
          <div>
            {updateMovie.isPaused
              ? 'mutation paused - offline'
              : updateMovie.isPending && 'updating...'}
          </div>
        </form>
      </Match>
      <Match when={movieQuery.isPaused}>
        We're offline and have no data to show :(
      </Match>
    </Switch>
  )
}
