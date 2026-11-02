import { render } from 'preact'
import { useState } from 'preact/hooks'
import {
  QueryClient,
  QueryClientProvider,
  useQueries,
} from '@tanstack/preact-query'
import { PreactQueryDevtools } from '@tanstack/preact-query-devtools'
import { charactersQueries } from './services/characters/queries'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 0,
    },
  },
})

function Characters({ ids }: { ids: Array<number> }) {
  const characters = useQueries({
    queries: ids.map((id) => charactersQueries.detail(id)),
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
            Status: {character.data.status}
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
          Character ids (numeric, comma separated)
        </label>
        <input
          style={{ display: 'inline-block' }}
          placeholder="ids"
          onInput={(event) => {
            const parsedIds = event.currentTarget.value
              .split(',')
              .map((id) => id.trim())

            if (parsedIds.every((id) => /^\d+$/.test(id))) {
              setIds(parsedIds.map(Number))
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
        disabled={!!error}
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
      <PreactQueryDevtools initialIsOpen />
    </QueryClientProvider>
  )
}

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Missing #root element')
render(<Root />, rootElement)
