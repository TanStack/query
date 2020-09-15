import React from 'react'
import axios from 'axios'
import {
  useQuery,
  useQueryCache,
  QueryCache,
  ReactQueryCacheProvider,
} from 'react-query'
import { ReactQueryDevtools } from 'react-query-devtools'

const getCharacters = async () => {
  await new Promise(r => setTimeout(r, 500))
  const { data } = await axios.get('https://rickandmortyapi.com/api/character/')
  return data
}

const getCharacter = async (key, selectedChar) => {
  await new Promise(r => setTimeout(r, 500))
  const { data } = await axios.get(
    `https://rickandmortyapi.com/api/character/${selectedChar}`
  )
  return data
}

const queryCache = new QueryCache()

export default function App() {
  return (
    <ReactQueryCacheProvider queryCache={queryCache}>
      <Example />
    </ReactQueryCacheProvider>
  )
}

function Example() {
  const cache = useQueryCache()
  const rerender = React.useReducer(d => d + 1)[1]
  const [selectedChar, setSelectedChar] = React.useState(1)

  const { data } = useQuery('characters', getCharacters)

  const { data: selectedData } = useQuery(
    ['character', selectedChar],
    getCharacter
  )

  const prefetchNext = async id => {
    await Promise.all([
      cache.prefetchQuery(['character', id + 1], getCharacter, {
        staleTime: 5 * 60 * 1000,
      }),
      cache.prefetchQuery(['character', id - 1], getCharacter, {
        staleTime: 5 * 60 * 1000,
      }),
    ])

    rerender()
  }

  return (
    <div className="App">
      <p>
        When selecting a character (eg. 12) it will also prefetch the sibling
        characters, too (eg. 11 and 13). When selecting one of the siblings
        after that (eg. 13), it will be displayed immediately and also refetched
        in the background.
      </p>
      <h2>Characters</h2>
      <ul>
        {data?.results.map(char => (
          <li
            key={char.id}
            onClick={() => {
              setSelectedChar(char.id)
              prefetchNext(char.id)
            }}
          >
            <div
              style={
                cache.getQueryData(['character', char.id])
                  ? {
                      fontWeight: 'bold',
                    }
                  : {}
              }
            >
              {char.id} - {char.name}
            </div>
          </li>
        ))}
      </ul>
      <h3>Selected Character</h3>
      <p>
        {selectedData?.name} ({selectedData?.status})
      </p>
      <ReactQueryDevtools initialIsOpen />
    </div>
  )
}
