import { render } from 'preact'
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/preact-query'
import { reposQueries } from './services/repos/queries'

const queryClient = new QueryClient()

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Example />
    </QueryClientProvider>
  )
}

const Example = () => {
  const { isPending, error, data, isFetching } = useQuery(reposQueries.detail())

  if (isPending) return 'Loading...'

  if (error !== null) return `An error has occurred: ${error.message}`

  return (
    <div>
      <h1>{data.full_name}</h1>
      <p>{data.description}</p>
      <strong>👀 {data.subscribers_count}</strong>{' '}
      <strong>✨ {data.stargazers_count}</strong>{' '}
      <strong>🍴 {data.forks_count}</strong>
      <div>{isFetching ? 'Updating...' : ''}</div>
    </div>
  )
}

const app = document.getElementById('app')
if (!app) throw new Error('Missing #app element')

render(<App />, app)
