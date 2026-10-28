import { ErrorBoundary, For, Suspense, createSignal } from 'solid-js'
import { A } from '@solidjs/router'
import { noop, useQuery, useQueryClient } from '@tanstack/solid-query'
import type { Character } from '~/services/characters/types'
import { charactersQueries } from '~/services/characters/queries'

function CharacterItem(props: {
  char: Character
  onSelect: (id: number) => void
}) {
  const queryClient = useQueryClient()

  const characterQuery = useQuery(() => ({
    ...charactersQueries.detail(props.char.id),
    enabled: false,
  }))

  const prefetch = () => {
    queryClient
      .query({
        ...charactersQueries.detail(props.char.id),
        staleTime: 10 * 1000, // only prefetch if older than 10 seconds
      })
      .catch(noop)
  }

  return (
    <li onMouseEnter={prefetch} onFocusIn={prefetch}>
      <button
        type="button"
        style={characterQuery.isSuccess ? { 'font-weight': 'bold' } : {}}
        onClick={() => {
          props.onSelect(props.char.id)
        }}
      >
        {props.char.id} - {props.char.name}
      </button>{' '}
      <A href={`/character/${props.char.id}`}>details</A>
    </li>
  )
}

function SelectedCharacter(props: { id: number }) {
  const characterQuery = useQuery(() => ({
    ...charactersQueries.detail(props.id),
    throwOnError: true,
  }))

  return <pre>{JSON.stringify(characterQuery.data, null, 2)}</pre>
}

export default function Example() {
  const [selectedChar, setSelectedChar] = createSignal(1)

  const charactersQuery = useQuery(() => ({
    ...charactersQueries.list(),
    throwOnError: true,
  }))

  return (
    <div class="App">
      <p>
        Hovering over a character will prefetch it, and when it's been
        prefetched it will turn <strong>bold</strong>. Clicking on a prefetched
        character will show their stats below immediately, and opening its
        details page will render it without a loading state.
      </p>
      <h2>Characters</h2>
      <ErrorBoundary fallback={(error) => <span>Error: {error.message}</span>}>
        <Suspense fallback="Loading...">
          <ul>
            <For each={charactersQuery.data?.results}>
              {(char) => (
                <CharacterItem char={char} onSelect={setSelectedChar} />
              )}
            </For>
          </ul>

          <h3>Selected Character</h3>
          <Suspense fallback="Loading...">
            <SelectedCharacter id={selectedChar()} />
          </Suspense>
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}
