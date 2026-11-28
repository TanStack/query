import {
  QueryClient,
  QueryClientProvider,
  isFetching,
  isPending,
  useQuery,
} from '@tanstack/react-query'
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { reposQueries } from './services/repos/queries'

const queryClient = new QueryClient()

export default function App() {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <QueryClientProvider client={queryClient}>
      <Example />
      <button
        onClick={() => setIsOpen(!isOpen)}
      >{`${isOpen ? 'Close' : 'Open'} the devtools panel`}</button>
      {isOpen && <ReactQueryDevtoolsPanel onClose={() => setIsOpen(false)} />}
    </QueryClientProvider>
  )
}

function Example() {
  const queryResult = useQuery(reposQueries.detail())
  const fetching = isFetching(queryResult)

  if (isPending(queryResult)) return 'Loading...'

  if (queryResult.error)
    return 'An error has occurred: ' + queryResult.error.message

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
      <div>{fetching ? 'Updating...' : ''}</div>
    </div>
  )
}

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Missing #root element')
ReactDOM.createRoot(rootElement).render(<App />)
