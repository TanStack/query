import { For, Match, Switch } from 'solid-js'
import { A } from '@solidjs/router'
import { useQuery } from '@tanstack/solid-query'
import { charactersQueries } from './services/characters/queries'

export default function Characters() {
  const query = useQuery(() => charactersQueries.list())

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
            <h2 class="text-4xl">Characters</h2>
            <For each={data().results}>
              {(person) => (
                <article>
                  <A
                    class="text-blue-500 hover:underline"
                    href={`/characters/${person.id}`}
                  >
                    <h6 class="text-xl">
                      {person.name} - {person.gender}: {person.species}
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
