/* @refresh reload */
import { Match, Show, Switch, createSignal } from 'solid-js'
import { render } from 'solid-js/web'
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/solid-query'
import { SolidQueryDevtoolsPanel } from '@tanstack/solid-query-devtools'
import { reposQueries } from './services/repos/queries'

const queryClient = new QueryClient()

export default function App() {
  const [isOpen, setIsOpen] = createSignal(false)

  return (
    <QueryClientProvider client={queryClient}>
      <Example />
      <button
        onClick={() => setIsOpen(!isOpen())}
      >{`${isOpen() ? 'Close' : 'Open'} the devtools panel`}</button>
      <Show when={isOpen()}>
        <SolidQueryDevtoolsPanel onClose={() => setIsOpen(false)} />
      </Show>
    </QueryClientProvider>
  )
}

function Example() {
  const query = useQuery(() => reposQueries.detail())

  return (
    <Switch>
      <Match when={query.isPending}>Loading...</Match>
      <Match when={query.isError}>
        {`An error has occurred: ${query.error?.message}`}
      </Match>
      <Match when={query.data}>
        {(data) => (
          <div
            style={{
              'padding-bottom': '20px',
            }}
          >
            <h1>{data().full_name}</h1>
            <p>{data().description}</p>
            <strong>👀 {data().subscribers_count}</strong>{' '}
            <strong>✨ {data().stargazers_count}</strong>{' '}
            <strong>🍴 {data().forks_count}</strong>
            <div>{query.isFetching ? 'Updating...' : ''}</div>
          </div>
        )}
      </Match>
    </Switch>
  )
}

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Missing #root element')
render(() => <App />, rootElement)
