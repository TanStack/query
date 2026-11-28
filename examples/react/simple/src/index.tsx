import {
  QueryClient,
  QueryClientProvider,
  isFetching,
  isPending,
  queryOptions,
  useQuery,
} from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import ReactDOM from 'react-dom/client'

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools />
      <Example />
    </QueryClientProvider>
  )
}

function Example() {
  const queryResult = useQuery(
    queryOptions({
      queryKey: ['repoData'],
      queryFn: async () => {
        const response = await fetch(
          'https://api.github.com/repos/TanStack/query',
        )
        if (!response.ok) throw new Error('Failed to fetch repo data')
        return await response.json()
      },
    }),
  )
  const fetching = isFetching(queryResult)

  if (isPending(queryResult)) return 'Loading...'

  if (queryResult.error)
    return 'An error has occurred: ' + queryResult.error.message

  return (
    <div>
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
