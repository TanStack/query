import { For, Match, Show, Switch } from 'solid-js'
import { A, useParams } from '@solidjs/router'
import { useQuery } from '@tanstack/solid-query'
import { charactersQueries } from './services/characters/queries'
import { episodesQueries } from './services/episodes/queries'
import { locationsQueries } from './services/locations/queries'

function Character() {
  const params = useParams<{ characterId: string }>()

  const query = useQuery(() => charactersQueries.detail(params.characterId))

  return (
    <Switch>
      <Match when={query.status === 'pending'}>
        <p>Loading...</p>
      </Match>
      <Match when={query.status === 'error'}>
        <p>Error :(</p>
      </Match>
      <Match when={query.data}>
        {(data) => {
          const locationId = () => {
            const locationUrlParts = data()
              .location.url.split('/')
              .filter(Boolean)
            return locationUrlParts[locationUrlParts.length - 1]
          }

          return (
            <div>
              <h2 class="text-4xl">{data().name}</h2>
              <p>
                <strong>Gender</strong>: {data().gender}
              </p>
              <p>
                <strong>Status</strong>: {data().status}
              </p>
              <p>
                <strong>Species</strong>: {data().species}
              </p>
              <p>
                <strong>Origin</strong>: {data().origin.name}
              </p>
              <p>
                <strong>Location</strong>:{' '}
                <Location locationId={locationId()} />
              </p>

              <h4 class="text-2xl pt-4">Episodes</h4>
              <For each={data().episode}>
                {(episode) => {
                  const episodeUrlParts = episode.split('/').filter(Boolean)
                  const episodeId = episodeUrlParts[episodeUrlParts.length - 1]
                  return <Episode episodeId={episodeId} />
                }}
              </For>
            </div>
          )
        }}
      </Match>
    </Switch>
  )
}

function Episode(props: { episodeId: string }) {
  const query = useQuery(() => episodesQueries.detail(props.episodeId))

  return (
    <Show when={query.status === 'success' && query.data}>
      {(data) => (
        <article>
          <A
            class="text-blue-500 hover:underline"
            href={`/episodes/${props.episodeId}`}
          >
            <h6 class="text-lg">
              {data().episode}. {data().name} - {data().air_date}
            </h6>
          </A>
        </article>
      )}
    </Show>
  )
}

function Location(props: { locationId: string }) {
  const query = useQuery(() => locationsQueries.detail(props.locationId))

  return (
    <Switch>
      <Match when={query.status === 'pending'}>
        <span>Loading...</span>
      </Match>
      <Match when={query.status === 'error'}>
        <span>Error :(</span>
      </Match>
      <Match when={query.data}>
        {(data) => (
          <span>
            {data().name} - {data().type}
          </span>
        )}
      </Match>
    </Switch>
  )
}

export default Character
