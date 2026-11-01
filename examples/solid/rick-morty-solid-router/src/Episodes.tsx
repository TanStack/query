import { For, Match, Switch } from 'solid-js'
import { A } from '@solidjs/router'
import { useQuery } from '@tanstack/solid-query'
import { episodesQueries } from './services/episodes/queries'

export default function Episodes() {
  const query = useQuery(() => episodesQueries.list())

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
            <h2 class="text-4xl">Episodes</h2>
            <For each={data().results}>
              {(episode) => (
                <article>
                  <A
                    class="text-blue-500 hover:underline"
                    href={`/episodes/${episode.id}`}
                  >
                    <h6 class="text-xl">
                      {episode.episode} - {episode.name}{' '}
                      <em>{episode.air_date}</em>
                    </h6>
                  </A>
                </article>
              )}
            </For>
          </div>
        )}
      </Match>
    </Switch>
  )
}
