import React from 'react'
import axios from 'axios'

//

import {
  useQuery,
  useQueryCache,
  useMutation,
  QueryCache,
  ReactQueryCacheProvider,
} from 'react-query'
import { ReactQueryDevtools } from 'react-query-devtools'

const queryCache = new QueryCache()

export default function App() {
  return (
    <ReactQueryCacheProvider queryCache={queryCache}>
      <Example />
    </ReactQueryCacheProvider>
  )
}

function Example() {
  const cache = useQueryCache()
  const [intervalMs, setIntervalMs] = React.useState(1000)
  const [value, setValue] = React.useState('')

  const { status, data, error, isFetching } = useQuery(
    'todos',
    async () => {
      const { data } = await axios.get('/api/data')
      return data
    },
    {
      // Refetch the data every second
      refetchInterval: intervalMs,
    }
  )

  const [mutateAddTodo] = useMutation(
    value => fetch(`/api/data?add=${value}`),
    {
      onSuccess: () => cache.invalidateQueries('todos'),
    }
  )

  const [mutateClear] = useMutation(value => fetch(`/api/data?clear=1`), {
    onSuccess: () => cache.invalidateQueries('todos'),
  })

  if (status === 'loading') return <h1>Loading...</h1>
  if (status === 'error') return <span>Error: {error.message}</span>

  return (
    <div>
      <h1>Auto Refetch with stale-time set to 1s)</h1>
      <p>
        This example is best experienced on your own machine, where you can open
        multiple tabs to the same localhost server and see your changes
        propagate between the two.
      </p>
      <label>
        Query Interval speed (ms):{' '}
        <input
          value={intervalMs}
          onChange={ev => setIntervalMs(Number(ev.target.value))}
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
        onSubmit={async ev => {
          ev.preventDefault()
          try {
            await mutateAddTodo(value)
            setValue('')
          } catch {}
        }}
      >
        <input
          placeholder="enter something"
          value={value}
          onChange={ev => setValue(ev.target.value)}
        />
      </form>
      <ul>
        {data.map(item => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <div>
        <button onClick={mutateClear}>Clear All</button>
      </div>
      <ReactQueryDevtools initialIsOpen />
    </div>
  )
}
