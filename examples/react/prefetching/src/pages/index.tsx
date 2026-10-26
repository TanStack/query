import React from 'react'
import Link from 'next/link'
import { noop, useQuery, useQueryClient } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { charactersQueries } from '../services/characters/queries'
import type { Character } from '../services/characters/types'

function CharacterItem({
  char,
  onSelect,
}: {
  char: Character
  onSelect: (id: number) => void
}) {
  const queryClient = useQueryClient()

  const { data } = useQuery({
    ...charactersQueries.detail(char.id),
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
            ...charactersQueries.detail(char.id),
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
        {char.id} - {char.name}{' '}
        <Link href={`/character/${char.id}`}>details</Link>
      </div>
    </li>
  )
}

export default function Example() {
  const [selectedChar, setSelectedChar] = React.useState(1)

  const charactersQuery = useQuery(charactersQueries.list())

  const characterQuery = useQuery(charactersQueries.detail(selectedChar))

  return (
    <div className="App">
      <p>
        Hovering over a character will prefetch it, and when it's been
        prefetched it will turn <strong>bold</strong>. Clicking on a prefetched
        character will show their stats below immediately, and opening its
        details page will render it without a loading state.
      </p>
      <h2>Characters</h2>
      {charactersQuery.isPending ? (
        'Loading...'
      ) : charactersQuery.isError ? (
        <span>Error: {charactersQuery.error.message}</span>
      ) : (
        <>
          <ul>
            {charactersQuery.data.results.map((char) => (
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
          ) : characterQuery.isError ? (
            <span>Error: {characterQuery.error.message}</span>
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
