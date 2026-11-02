import { For, Match, Show, Switch } from 'solid-js'
import { A, useParams } from '@solidjs/router'
import { useQuery } from '@tanstack/solid-query'
import { filmsQueries } from './services/films/queries'
import { charactersQueries } from './services/characters/queries'

export default function Film() {
  const params = useParams<{ filmId: string }>()

  const query = useQuery(() => filmsQueries.detail(params.filmId))

  return (
    <Switch>
      <Match when={!params.filmId}>
        <p>Invalid film ID</p>
      </Match>
      <Match when={query.status === 'pending'}>
        <p>Loading...</p>
      </Match>
      <Match when={query.status === 'error'}>
        <p>Error :(</p>
      </Match>
      <Match when={query.data}>
        {(data) => (
          <div>
            <h2 class="text-4xl">{data().title}</h2>
            <p>{data().opening_crawl}</p>
            <br />
            <h4 class="text-2xl">Characters</h4>
            <For each={data().characters}>
              {(character) => {
                const characterUrlParts = character.split('/').filter(Boolean)
                const characterId =
                  characterUrlParts[characterUrlParts.length - 1]
                return <Character characterId={characterId} />
              }}
            </For>
          </div>
        )}
      </Match>
    </Switch>
  )
}

function Character(props: { characterId: string }) {
  const query = useQuery(() => charactersQueries.detail(props.characterId))

  return (
    <Show when={query.status === 'success' && query.data}>
      {(data) => (
        <A
          class="text-blue-500 hover:underline"
          href={`/characters/${props.characterId}`}
        >
          <h6 class="text-lg">{data().name}</h6>
        </A>
      )}
    </Show>
  )
}
