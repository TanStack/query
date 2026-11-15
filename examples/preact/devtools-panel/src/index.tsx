import { render } from 'preact'
import { useState } from 'preact/hooks'
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/preact-query'
import { PreactQueryDevtoolsPanel } from '@tanstack/preact-query-devtools'
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
  const { isPending, error, data, isFetching } = useQuery(reposQueries.detail())

  if (isPending) return 'Loading...'

  if (error) return `An error has occurred: ${error.message}`

  return (
    <div
      style={{
        paddingBottom: 20,
      }}
    >
      <h1>{data.full_name}</h1>
      <p>{data.description}</p>
      <strong>👀 {data.subscribers_count}</strong>{' '}
      <strong>✨ {data.stargazers_count}</strong>{' '}
      <strong>🍴 {data.forks_count}</strong>
      <div>{isFetching ? 'Updating...' : ''}</div>
    </div>
  )
}

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Missing #root element')
render(<App />, rootElement)
