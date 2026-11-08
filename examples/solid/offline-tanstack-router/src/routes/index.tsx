import { useQuery } from '@tanstack/solid-query'
import { Link, createFileRoute } from '@tanstack/solid-router'
import { For, Match, Show, Switch } from 'solid-js'
import { moviesQueries } from '../services/movies/queries'

export const Route = createFileRoute('/')({
  component: List,
})

function List() {
  const moviesQuery = useQuery(() => moviesQueries.list())

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
                  <Link to="/$movieId" params={{ movieId: movie.id }}>
                    {movie.title}
                  </Link>
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
      <Match when={moviesQuery.isError}>
        <div>
          <h1>Couldn't load movies!</h1>
          <div>{moviesQuery.error?.message}</div>
        </div>
      </Match>
    </Switch>
  )
}
