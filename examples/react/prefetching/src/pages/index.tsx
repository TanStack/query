import React from 'react'
import {
  noop,
  queryOptions,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

type Character = {
  id: number
  name: string
}

const getCharacters = async (): Promise<{
  results: Array<Character>
}> => {
  await new Promise((r) => setTimeout(r, 500))
  const response = await fetch('https://rickandmortyapi.com/api/character/')
  if (!response.ok) throw new Error('Failed to fetch characters')
  return await response.json()
}

const getCharacter = async (selectedChar: number): Promise<Character> => {
  await new Promise((r) => setTimeout(r, 500))
  const response = await fetch(
    `https://rickandmortyapi.com/api/character/${selectedChar}`,
  )
  if (!response.ok) throw new Error('Failed to fetch character')
  return await response.json()
}

const charactersQueryOptions = queryOptions({
  queryKey: ['characters'],
  queryFn: getCharacters,
})

const characterQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ['character', id],
    queryFn: () => getCharacter(id),
  })

function CharacterItem({
  char,
  onSelect,
}: {
  char: Character
  onSelect: (id: number) => void
}) {
  const queryClient = useQueryClient()

  const { data } = useQuery({
    ...characterQueryOptions(char.id),
    enabled: false,
  })

  return (
    <li
      onClick={() => {
        onSelect(char.id)
      }}
      onMouseEnter={() => {
        queryClient
          .query({
            ...characterQueryOptions(char.id),
            staleTime: 10 * 1000, // only prefetch if older than 10 seconds
          })
          .catch(noop)
      }}
    >
      <div
        style={
          data
            ? {
                fontWeight: 'bold',
              }
            : {}
        }
      >
        {char.id} - {char.name}
      </div>
    </li>
  )
}

export default function Example() {
  const [selectedChar, setSelectedChar] = React.useState(1)

  const charactersQuery = useQuery(charactersQueryOptions)

  const characterQuery = useQuery(characterQueryOptions(selectedChar))

  return (
    <div className="App">
      <p>
        Hovering over a character will prefetch it, and when it's been
        prefetched it will turn <strong>bold</strong>. Clicking on a prefetched
        character will show their stats below immediately.
      </p>
      <h2>Characters</h2>
      {charactersQuery.isPending ? (
        'Loading...'
      ) : (
        <>
          <ul>
            {charactersQuery.data?.results.map((char) => (
              <CharacterItem
                key={char.id}
                char={char}
                onSelect={setSelectedChar}
              />
            ))}
          </ul>

          <h3>Selected Character</h3>
          {characterQuery.isPending ? (
            'Loading...'
          ) : (
            <>
              <pre>{JSON.stringify(characterQuery.data, null, 2)}</pre>
            </>
          )}
          <ReactQueryDevtools initialIsOpen />
        </>
      )}
    </div>
  )
}
