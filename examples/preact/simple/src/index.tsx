import {
  QueryClient,
  QueryClientProvider,
  isFetching,
  isPending,
  queryOptions,
  useQuery,
} from '@tanstack/preact-query'
import { render } from 'preact'

const queryClient = new QueryClient()

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Example />
    </QueryClientProvider>
  )
}

const Example = () => {
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

  if (isPending(queryResult)) return 'Loading...'

  if (queryResult.error !== null)
    return `An error has occurred: ${queryResult.error.message}`

  return (
    <div>
      <h1>{queryResult.data.full_name}</h1>
      <p>{queryResult.data.description}</p>
      <strong>👀 {queryResult.data.subscribers_count}</strong>{' '}
      <strong>✨ {queryResult.data.stargazers_count}</strong>{' '}
      <strong>🍴 {queryResult.data.forks_count}</strong>
      <div>{isFetching(queryResult) ? 'Updating...' : ''}</div>
    </div>
  )
}

const app = document.getElementById('app')
if (!app) throw new Error('Missing #app element')

render(<App />, app)
