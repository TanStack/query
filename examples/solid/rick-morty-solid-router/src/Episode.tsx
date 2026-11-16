import { For, Match, Switch } from 'solid-js'
import { A, useParams } from '@solidjs/router'
import { useQuery } from '@tanstack/solid-query'
import { charactersQueries } from './services/characters/queries'
import { episodesQueries } from './services/episodes/queries'

function Episode() {
  const params = useParams<{ episodeId: string }>()

  const query = useQuery(() => episodesQueries.detail(params.episodeId))

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
            <h2 class="text-4xl">{data().name}</h2>
            <p>{data().air_date}</p>
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
    <Switch>
      <Match when={query.status === 'pending'}>
        <p>Loading...</p>
      </Match>
      <Match when={query.status === 'error'}>
        <p>Error :(</p>
      </Match>
      <Match when={query.data}>
        {(data) => (
          <article>
            <A
              class="text-blue-500 hover:underline"
              href={`/characters/${props.characterId}`}
            >
              <h6 class="text-lg">{data().name}</h6>
            </A>
          </article>
        )}
      </Match>
    </Switch>
  )
}

export default Episode
