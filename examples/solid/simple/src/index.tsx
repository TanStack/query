/* @refresh reload */
import {
  createQuery,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/solid-query'
import { Match, Switch } from 'solid-js'
import { render } from 'solid-js/web'

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Example />
    </QueryClientProvider>
  )
}

function Example() {
  const state = createQuery({
    queryKey: () => ['repoData'],
    queryFn: async () => {
      const response = await fetch(
        'https://api.github.com/repos/tannerlinsley/react-query',
        {
          method: 'GET',
        },
      )
      return response.json()
    },
  })

  return (
    <Switch>
      <Match when={state.isLoading}>Loading...</Match>
      <Match when={state.error}>
        {'An error has occurred: ' + (state.error as Error).message}
      </Match>
      <Match when={state.data !== undefined}>
        <div>
          <h1>{state.data.name}</h1>
          <p>{state.data.description}</p>
          <strong>👀 {state.data.subscribers_count}</strong>{' '}
          <strong>✨ {state.data.stargazers_count}</strong>{' '}
          <strong>🍴 {state.data.forks_count}</strong>
          <div>{state.isFetching ? 'Updating...' : ''}</div>
        </div>
      </Match>
    </Switch>
  )
}
render(() => <App />, document.getElementById('root') as HTMLElement)
