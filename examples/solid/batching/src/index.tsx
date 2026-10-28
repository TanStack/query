/* @refresh reload */
import { Index, Match, Show, Switch, createSignal } from 'solid-js'
import { render } from 'solid-js/web'
import {
  QueryClient,
  QueryClientProvider,
  useQueries,
} from '@tanstack/solid-query'
import { SolidQueryDevtools } from '@tanstack/solid-query-devtools'
import { charactersQueries } from './services/characters/queries'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 0,
    },
  },
})

function Characters(props: { ids: Array<number> }) {
  const characters = useQueries(() => ({
    queries: props.ids.map((id) => charactersQueries.detail(id)),
  }))

  return (
    <Index each={characters}>
      {(character) => (
        <Switch>
          <Match when={character().status === 'pending'}>Loading...</Match>
          <Match when={character().status === 'error'}>Error...</Match>
          <Match when={character().data === null}>Not found ...</Match>
          <Match when={character().data}>
            {(data) => (
              <div style={{ display: 'flex' }}>
                <img
                  width={100}
                  height={100}
                  alt={data().image}
                  src={data().image}
                />
                <div style={{ 'padding-left': '10px', 'text-align': 'left' }}>
                  <h5 style={{ 'margin-top': 0, 'margin-bottom': '5px' }}>
                    {data().name} (#{data().id})
                  </h5>
                  <p style={{ 'margin-top': 0, 'margin-bottom': '2px' }}>
                    Status: {data().status}
                  </p>
                  <p style={{ 'margin-top': 0, 'margin-bottom': '2px' }}>
                    Species: {data().species}
                  </p>
                  <p style={{ 'margin-top': 0, 'margin-bottom': '2px' }}>
                    Gender: {data().gender}
                  </p>
                </div>
              </div>
            )}
          </Match>
        </Switch>
      )}
    </Index>
  )
}

function App() {
  const [ids, setIds] = createSignal<Array<number>>([])
  const [idsToLoad, setIdsToLoad] = createSignal<Array<number>>([])
  const [error, setError] = createSignal('')

  return (
    <div class="App">
      <h2>Character fetcher</h2>
      <div>
        <label style={{ display: 'block' }}>
          Character ids (numeric, comma separated)
        </label>
        <input
          style={{ display: 'inline-block' }}
          placeholder="ids"
          onInput={(event) => {
            const text = event.currentTarget.value.replace(' ', '')
            const parsedIds = text.split(',').map((id) => parseInt(id, 10))
            const allValid = parsedIds.reduce(
              (valid, id) => valid && !isNaN(id),
              true,
            )

            if (allValid) {
              setIds(parsedIds)
              setError('')
            } else {
              setError('Invalid.. only use numbers and comma')
            }
          }}
        />
      </div>

      <Show when={error()}>
        <h3 style={{ color: 'red' }}>{error()}</h3>
      </Show>

      <button
        type="button"
        onClick={() => {
          setIdsToLoad(ids())
        }}
      >
        Load characters
      </button>
      <div>
        <h4 style={{ 'text-align': 'left' }}>Characters:</h4>
        <Characters ids={idsToLoad()} />
      </div>
    </div>
  )
}

function Root() {
  return (
    <QueryClientProvider client={queryClient}>
      <App />
      <SolidQueryDevtools initialIsOpen />
    </QueryClientProvider>
  )
}

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Missing #root element')
render(() => <Root />, rootElement)
