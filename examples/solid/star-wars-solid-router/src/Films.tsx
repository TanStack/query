import { For, Match, Switch } from 'solid-js'
import { A } from '@solidjs/router'
import { useQuery } from '@tanstack/solid-query'
import { filmsQueries } from './services/films/queries'

export default function Films() {
  const query = useQuery(() => filmsQueries.list())

  return (
    <Switch>
      <Match when={query.status === 'pending'}>
        <p>Loading...</p>
      </Match>
      <Match when={query.status === 'error'}>
        <p>Error :(</p>
      </Match>
      <Match when={query.data}>
        {(data) => (
          <div>
            <h2 class="text-4xl">Films</h2>
            <For each={data().results}>
              {(film) => {
                const filmUrlParts = film.url.split('/').filter(Boolean)
                const filmId = filmUrlParts[filmUrlParts.length - 1]
                return (
                  <article>
                    <A
                      class="text-blue-500 hover:underline"
                      href={`/films/${filmId}`}
                    >
                      <h6 class="text-xl">
                        {film.episode_id}. {film.title}{' '}
                        <em>
                          (
                          {new Date(
                            Date.parse(film.release_date),
                          ).getFullYear()}
                          )
                        </em>
                      </h6>
                    </A>
                  </article>
                )
              }}
            </For>
          </div>
        )}
      </Match>
    </Switch>
  )
}
