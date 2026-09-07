import ReactDOM from 'react-dom/client'
import {
  QueryClient,
  QueryClientProvider,
  queryOptions,
  useQueries,
} from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'
import { loadCharacter } from './character-loader'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 0,
    },
  },
})

const characterQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ['character', id],
    queryFn: () => loadCharacter(id),
    staleTime: 60 * 1000,
  })

function Characters({ ids }: { ids: Array<number> }) {
  const characters = useQueries({
    queries: ids.map((id) => characterQueryOptions(id)),
  })

  return characters.map((character, index) => {
    if (character.status === 'pending') {
      return 'Loading...'
    }
    if (character.status === 'error') {
      return 'Error...'
    }
    if (character.data === null) {
      return 'Not found ...'
    }

    return (
      <div key={String(index)} style={{ display: 'flex' }}>
        <img
          width={100}
          height={100}
          alt={character.data.image}
          src={character.data.image}
        />
        <div style={{ paddingLeft: 10, textAlign: 'left' }}>
          <h5 style={{ marginTop: 0, marginBottom: 5 }}>
            {character.data.name} (#{character.data.id})
          </h5>
          <p style={{ marginTop: 0, marginBottom: 2 }}>
            Status: {character.status}
          </p>
          <p style={{ marginTop: 0, marginBottom: 2 }}>
            Species: {character.data.species}
          </p>
          <p style={{ marginTop: 0, marginBottom: 2 }}>
            Gender: {character.data.gender}
          </p>
        </div>
      </div>
    )
  })
}

function App() {
  const [ids, setIds] = useState<Array<number>>([])
  const [idsToLoad, setIdsToLoad] = useState<Array<number>>([])
  const [error, setError] = useState('')

  return (
    <div className="App">
      <h2>Character fetcher</h2>
      <div>
        <label style={{ display: 'block' }}>
          Character ids (numberic, comma seprated)
        </label>
        <input
          style={{ display: 'inline-block' }}
          placeholder="ids"
          onChange={(event) => {
            const text = event.target.value.replace(' ', '')
            const ids = text.split(',').map((id) => parseInt(id, 10))
            const allValid = ids.reduce(
              (valid, id) => valid && !isNaN(id),
              true,
            )

            if (allValid) {
              setIds(ids)
              setError('')
            } else {
              setError('Invalid.. only use numbers and comma')
            }
          }}
        />
      </div>

      {error ? <h3 style={{ color: 'red' }}>{error}</h3> : null}

      <button
        type="button"
        onClick={() => {
          setIdsToLoad(ids)
        }}
      >
        Load characters
      </button>
      <div>
        <h4 style={{ textAlign: 'left' }}>Characters:</h4>
        <Characters ids={idsToLoad} />
      </div>
    </div>
  )
}

function Root() {
  return (
    <QueryClientProvider client={queryClient}>
      <App />
      <ReactQueryDevtools initialIsOpen />
    </QueryClientProvider>
  )
}

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Missing #root element')
ReactDOM.createRoot(rootElement).render(<Root />)
