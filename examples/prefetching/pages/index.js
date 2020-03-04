import React from 'react'
import { useQuery, queryCache } from 'react-query'
import { ReactQueryDevtools } from 'react-query-devtools'

const getCharacters = async () => {
  const r = await fetch('https://rickandmortyapi.com/api/character/')
  return r.json()
}

const getCharacter = async (key, selectedChar) => {
  const r = await fetch(
    `https://rickandmortyapi.com/api/character/${selectedChar}`
  )
  return r.json()
}

export default function App() {
  const [selectedChar, setSelectedChar] = React.useState(1)

  const { data } = useQuery('characters', getCharacters)

  const { data: selectedData } = useQuery(
    ['character', selectedChar],
    getCharacter
  )

  const prefetchNext = async id => {
    queryCache.prefetchQuery(['character', id + 1], getCharacter, {
      staleTime: 5 * 60 * 1000,
    })

    queryCache.prefetchQuery(['character', id - 1], getCharacter, {
      staleTime: 5 * 60 * 1000,
    })
  }

  return (
    <div className="App">
      <p>
        When selecting a character (ex: 12) it should prefetch characters 11 and
        13 and load character 12. When selecting the next character (13),
        characters 12, 13, 14 refetch when they should be cached with a
        staleTime of 5 minutes
      </p>
      <p>
        Note: In real feature, I don't have data already available. Selecting an
        object would fire off two other API requests to show different data than
        the first request
      </p>
      <ul>
        {data?.results.map(char => (
          <li
            key={char.id}
            onClick={() => {
              setSelectedChar(char.id)
              prefetchNext(char.id)
            }}
          >
            {char.id} - {char.name}
          </li>
        ))}
      </ul>
      <p>{selectedData?.name}</p>
      <ReactQueryDevtools />
    </div>
  )
}
