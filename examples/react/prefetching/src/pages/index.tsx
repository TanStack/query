import React from 'react'
import { noop, useQuery, useQueryClient } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

const getCharacters = async (): Promise<{
  results: Array<{ id: number; name: string }>
}> => {
  await new Promise((r) => setTimeout(r, 500))
  const response = await fetch('https://rickandmortyapi.com/api/character/')
  return await response.json()
}

const getCharacter = async (selectedChar: number) => {
  await new Promise((r) => setTimeout(r, 500))
  const response = await fetch(
    `https://rickandmortyapi.com/api/character/${selectedChar}`,
  )
  return await response.json()
}

function CharacterItem({
  char,
  onSelect,
}: {
  char: { id: number; name: string }
  onSelect: (id: number) => void
}) {
  const queryClient = useQueryClient()

  const { data } = useQuery({
    queryKey: ['character', char.id],
    queryFn: () => getCharacter(char.id),
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
            queryKey: ['character', char.id],
            queryFn: () => getCharacter(char.id),
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

  const charactersQuery = useQuery({
    queryKey: ['characters'],
    queryFn: getCharacters,
  })

  const characterQuery = useQuery({
    queryKey: ['character', selectedChar],
    queryFn: () => getCharacter(selectedChar),
  })

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
