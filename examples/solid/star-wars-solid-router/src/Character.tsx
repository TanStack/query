import { For, Match, Show, Switch } from 'solid-js'
import { A, useParams } from '@solidjs/router'
import { useQuery } from '@tanstack/solid-query'
import { filmsQueries } from './services/films/queries'
import { charactersQueries } from './services/characters/queries'
import { planetsQueries } from './services/planets/queries'

export default function Character() {
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
          const homeworldId = () => {
            const homeworldUrlParts = data()
              .homeworld.split('/')
              .filter(Boolean)
            return homeworldUrlParts[homeworldUrlParts.length - 1]
          }

          return (
            <div>
              <h2 class="text-4xl">{data().name}</h2>
              <p>
                <strong>Born</strong>: {data().birth_year}
              </p>
              <p>
                <strong>Eyes</strong>: {data().eye_color}
              </p>
              <p>
                <strong>Hair</strong>: {data().hair_color}
              </p>
              <p>
                <strong>Height</strong>: {data().height}
              </p>
              <p>
                <strong>Mass</strong>: {data().mass}
              </p>
              <p>
                <strong>Homeworld</strong>:{' '}
                <Homeworld homeworldId={homeworldId()} />
              </p>

              <h4 class="text-2xl pt-4">Films</h4>
              <For each={data().films}>
                {(film) => {
                  const filmUrlParts = film.split('/').filter(Boolean)
                  const filmId = filmUrlParts[filmUrlParts.length - 1]
                  return <Film filmId={filmId} />
                }}
              </For>
            </div>
          )
        }}
      </Match>
    </Switch>
  )
}

function Film(props: { filmId: string }) {
  const query = useQuery(() => filmsQueries.detail(props.filmId))

  return (
    <Show when={query.status === 'success' && query.data}>
      {(data) => (
        <A
          class="text-blue-500 hover:underline"
          href={`/films/${props.filmId}`}
        >
          <h6 class="text-lg">
            {data().episode_id}. {data().title}
          </h6>
        </A>
      )}
    </Show>
  )
}

function Homeworld(props: { homeworldId: string }) {
  const query = useQuery(() => planetsQueries.detail(props.homeworldId))

  return (
    <Switch>
      <Match when={query.status === 'pending'}>
        <span>Loading...</span>
      </Match>
      <Match when={query.status === 'error'}>
        <span>Error :(</span>
      </Match>
      <Match when={query.data}>{(data) => <span>{data().name}</span>}</Match>
    </Switch>
  )
}
