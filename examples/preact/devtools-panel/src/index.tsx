import {
  QueryClient,
  QueryClientProvider,
  isFetching,
  isPending,
  useQuery,
} from '@tanstack/preact-query'
import { PreactQueryDevtoolsPanel } from '@tanstack/preact-query-devtools'
import { render } from 'preact'
import { useState } from 'preact/hooks'
import { reposQueries } from './services/repos/queries'

const queryClient = new QueryClient()

export default function App() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <QueryClientProvider client={queryClient}>
      <Example />
      <button
        onClick={() => setIsOpen(!isOpen)}
      >{`${isOpen ? 'Close' : 'Open'} the devtools panel`}</button>
      {isOpen && <PreactQueryDevtoolsPanel onClose={() => setIsOpen(false)} />}
    </QueryClientProvider>
  )
}

function Example() {
  const queryResult = useQuery(reposQueries.detail())

  if (isPending(queryResult)) return 'Loading...'

  if (queryResult.error)
    return `An error has occurred: ${queryResult.error.message}`

  return (
    <div
      style={{
        paddingBottom: 20,
      }}
    >
      <h1>{queryResult.data.full_name}</h1>
      <p>{queryResult.data.description}</p>
      <strong>👀 {queryResult.data.subscribers_count}</strong>{' '}
      <strong>✨ {queryResult.data.stargazers_count}</strong>{' '}
      <strong>🍴 {queryResult.data.forks_count}</strong>
      <div>{isFetching(queryResult) ? 'Updating...' : ''}</div>
    </div>
  )
}

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Missing #root element')
render(<App />, rootElement)
