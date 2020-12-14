import React from 'react'
import axios from 'axios'
import {
  useQuery,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
} from 'react-query'
import { ReactQueryDevtools } from 'react-query/devtools'

const getCharacters = async () => {
  await new Promise(r => setTimeout(r, 500))
  const { data } = await axios.get('https://rickandmortyapi.com/api/character/')
  return data
}

const getCharacter = async selectedChar => {
  await new Promise(r => setTimeout(r, 500))
  const { data } = await axios.get(
    `https://rickandmortyapi.com/api/character/${selectedChar}`
  )
  return data
}

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Example />
    </QueryClientProvider>
  )
}

function Example() {
  const queryClient = useQueryClient()
  const rerender = React.useState(0)[1]
  const [selectedChar, setSelectedChar] = React.useState(1)

  const charactersQuery = useQuery('characters', getCharacters)

  const characterQuery = useQuery(['character', selectedChar], () =>
    getCharacter(selectedChar)
  )

  return (
    <div className="App">
      <p>
        Hovering over a character will prefetch it, and when it's been
        prefetched it will turn <strong>bold</strong>. Clicking on a prefetched
        character will show their stats below immediately.
      </p>
      <h2>Characters</h2>
      {charactersQuery.isLoading ? (
        'Loading...'
      ) : (
        <>
          <ul>
            {charactersQuery.data?.results.map(char => (
              <li
                key={char.id}
                onClick={() => {
                  setSelectedChar(char.id)
                }}
                onMouseEnter={async () => {
                  await queryClient.prefetchQuery(
                    ['character', char.id],
                    () => getCharacter(char.id),
                    {
                      staleTime: 10 * 1000, // only prefetch if older than 10 seconds
                    }
                  )

                  setTimeout(() => {
                    rerender({})
                  }, 1)
                }}
              >
                <div
                  style={
                    queryClient.getQueryData(['character', char.id])
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
          {characterQuery.isLoading ? (
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
