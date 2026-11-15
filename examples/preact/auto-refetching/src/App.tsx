import { useState } from 'preact/hooks'

import { useMutation, useQuery, useQueryClient } from '@tanstack/preact-query'
import { PreactQueryDevtools } from '@tanstack/preact-query-devtools'
import { todosMutations, todosQueries } from './services/todos/queries'

export default function App() {
  const queryClient = useQueryClient()
  const [intervalMs, setIntervalMs] = useState(1000)
  const [value, setValue] = useState('')

  const { status, data, error, isFetching } = useQuery({
    ...todosQueries.list(),
    // Refetch the data every second
    refetchInterval: intervalMs,
  })

  const addMutation = useMutation({
    ...todosMutations.create(),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: todosQueries.all() }),
  })

  const clearMutation = useMutation({
    ...todosMutations.deleteAll(),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: todosQueries.all() }),
  })

  if (status === 'pending') return <h1>Loading...</h1>
  if (status === 'error') return <span>Error: {error.message}</span>

  return (
    <div>
      <h1>Auto Refetch with refetchInterval set to {intervalMs}ms</h1>
      <p>
        This example is best experienced on your own machine, where you can open
        multiple tabs to the same localhost server and see your changes
        propagate between the two.
      </p>
      <label>
        Query Interval speed (ms):{' '}
        <input
          value={intervalMs}
          onInput={(ev) => setIntervalMs(Number(ev.currentTarget.value))}
          type="number"
          step="100"
        />{' '}
        <span
          style={{
            display: 'inline-block',
            marginLeft: '.5rem',
            width: 10,
            height: 10,
            background: isFetching ? 'green' : 'transparent',
            transition: !isFetching ? 'all .3s ease' : 'none',
            borderRadius: '100%',
            transform: 'scale(2)',
          }}
        />
      </label>
      <h2>Todo List</h2>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          addMutation.mutate(value, {
            onSuccess: () => {
              setValue('')
            },
          })
        }}
      >
        <input
          placeholder="enter something"
          value={value}
          onInput={(ev) => setValue(ev.currentTarget.value)}
        />
      </form>
      <ul>
        {data.map((item) => (
          <li key={item}>{item}</li>
        ))}
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
      <PreactQueryDevtools initialIsOpen />
    </div>
  )
}
