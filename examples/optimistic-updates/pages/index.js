import React from 'react'
import axios from 'axios'

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
  const [text, setText] = React.useState('')
  const { status, data, error, isFetching } = useQuery('todos', async () => {
    const { data } = await axios.get('/api/data')
    return data
  })

  const [mutatePostTodo] = useMutation(
    text => axios.post('/api/data', { text }),
    {
      // Optimistically update the cache value on mutate, but store
      // the old value and return it so that it's accessible in case of
      // an error
      onMutate: text => {
        setText('')
        cache.cancelQueries('todos')

        const previousValue = cache.getQueryData('todos')

        cache.setQueryData('todos', old => ({
          ...old,
          items: [...old.items, text],
        }))

        return previousValue
      },
      // On failure, roll back to the previous value
      onError: (err, variables, previousValue) =>
        cache.setQueryData('todos', previousValue),
      // After success or failure, refetch the todos query
      onSettled: () => {
        cache.invalidateQueries('todos')
      },
    }
  )

  return (
    <div>
      <p>
        In this example, new items can be created using a mutation. The new item
        will be optimistically added to the list in hopes that the server
        accepts the item. If it does, the list is refetched with the true items
        from the list. Every now and then, the mutation may fail though. When
        that happens, the previous list of items is restored and the list is
        again refetched from the server.
      </p>
      <form
        onSubmit={e => {
          e.preventDefault()
          mutatePostTodo(text)
        }}
      >
        <input
          type="text"
          onChange={event => setText(event.target.value)}
          value={text}
        />
        <button>Create</button>
      </form>
      <br />
      {status === 'loading' ? (
        'Loading...'
      ) : status === 'error' ? (
        error.message
      ) : (
        <>
          <div>Updated At: {new Date(data.ts).toLocaleTimeString()}</div>
          <ul>
            {data.items.map(datum => (
              <li key={datum}>{datum}</li>
            ))}
          </ul>
          <div>{isFetching ? 'Updating in background...' : ' '}</div>
        </>
      )}
      <ReactQueryDevtools initialIsOpen />
    </div>
  )
}
