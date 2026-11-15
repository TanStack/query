import { ErrorBoundary, For, Suspense, createSignal } from 'solid-js'
import { useMutation, useQuery, useQueryClient } from '@tanstack/solid-query'
import { todosMutations, todosQueries } from '~/services/todos/queries'

export default function Example() {
  const queryClient = useQueryClient()
  const [intervalMs, setIntervalMs] = createSignal(1000)
  const [value, setValue] = createSignal('')

  const todosQuery = useQuery(() => ({
    ...todosQueries.list(),
    // Refetch the data every second
    refetchInterval: intervalMs(),
    throwOnError: true,
  }))

  const addMutation = useMutation(() => ({
    ...todosMutations.create(),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: todosQueries.all() }),
  }))

  const clearMutation = useMutation(() => ({
    ...todosMutations.deleteAll(),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: todosQueries.all() }),
  }))

  return (
    <ErrorBoundary fallback={(error) => <span>Error: {error.message}</span>}>
      <Suspense fallback={<h1>Loading...</h1>}>
        <div>
          <h1>Auto Refetch with refetchInterval set to {intervalMs()}ms</h1>
          <p>
            This example is best experienced on your own machine, where you can
            open multiple tabs to the same localhost server and see your changes
            propagate between the two.
          </p>
          <label>
            Query Interval speed (ms):{' '}
            <input
              value={intervalMs()}
              onInput={(ev) => setIntervalMs(Number(ev.currentTarget.value))}
              type="number"
              step="100"
            />{' '}
            <span
              style={{
                display: 'inline-block',
                'margin-left': '.5rem',
                width: '10px',
                height: '10px',
                background: todosQuery.isFetching ? 'green' : 'transparent',
                transition: !todosQuery.isFetching ? 'all .3s ease' : 'none',
                'border-radius': '100%',
                transform: 'scale(2)',
              }}
            />
          </label>
          <h2>Todo List</h2>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              addMutation.mutate(value(), {
                onSuccess: () => {
                  setValue('')
                },
              })
            }}
          >
            <input
              placeholder="enter something"
              value={value()}
              onInput={(ev) => setValue(ev.currentTarget.value)}
            />
          </form>
          <ul>
            <For each={todosQuery.data}>{(item) => <li>{item}</li>}</For>
          </ul>
          <div>
            <button
              onClick={() => {
                clearMutation.mutate()
              }}
            >
              Clear All
            </button>
          </div>
        </div>
      </Suspense>
    </ErrorBoundary>
  )
}
