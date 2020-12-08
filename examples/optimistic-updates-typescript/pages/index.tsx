import * as React from 'react'
import axios, { AxiosError } from 'axios'

import {
  useQuery,
  useQueryClient,
  useMutation,
  QueryClient,
  QueryClientProvider,
  UseQueryOptions,
} from 'react-query'
import { ReactQueryDevtools } from 'react-query-devtools'

const client = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={client}>
      <Example />
      <TodoCounter />
      <ReactQueryDevtools initialIsOpen />
    </QueryClientProvider>
  )
}

type TodoData = {
  items: readonly {
    id: string
    text: string
  }[]
  ts: number
}

async function fetchTodos(): Promise<TodoData> {
  const res = await axios.get('/api/data')
  return res.data
}

function useTodos<TData = TodoData>(
  options?: UseQueryOptions<TData, AxiosError, TodoData>
) {
  return useQuery('todos', fetchTodos, options)
}

function TodoCounter() {
  const counterQuery = useTodos({
    select: data => data.items.length,
    notifyOnChangeProps: ['data'],
  })

  React.useEffect(() => {
    console.log('rendering counter')
  })

  return <div>TodoCounter: {counterQuery.data ?? 0}</div>
}

function Example() {
  const queryClient = useQueryClient()
  const [text, setText] = React.useState('')
  const { isFetching, ...queryInfo } = useTodos()

  const addTodoMutation = useMutation(
    (newTodo: string) => axios.post('/api/data', { text: newTodo }),
    {
      // Optimistically update the cache value on mutate, but store
      // the old value and return it so that it's accessible in case of
      // an error
      onMutate: async newTodo => {
        setText('')
        await queryClient.cancelQueries('todos')

        const previousValue = queryClient.getQueryData<TodoData>('todos')

        if (previousValue) {
          queryClient.setQueryData<TodoData>('todos', {
            ...previousValue,
            items: [
              ...previousValue.items,
              { id: Math.random().toString(), text: newTodo },
            ],
          })
        }

        return previousValue
      },
      // On failure, roll back to the previous value
      onError: (err, variables, previousValue) => {
        queryClient.setQueryData('todos', previousValue)
      },
      // After success or failure, refetch the todos query
      onSettled: () => {
        queryClient.invalidateQueries('todos')
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
          addTodoMutation.mutate(text)
        }}
      >
        <input
          type="text"
          onChange={event => setText(event.target.value)}
          value={text}
        />
        <button disabled={addTodoMutation.isLoading}>Create</button>
      </form>
      <br />
      {queryInfo.isSuccess && (
        <>
          <div>
            {/* The type of queryInfo.data will be narrowed because we check for isSuccess first */}
            Updated At: {new Date(queryInfo.data.ts).toLocaleTimeString()}
          </div>
          <ul>
            {queryInfo.data.items.map(todo => (
              <li key={todo.id}>{todo.text}</li>
            ))}
          </ul>
          {isFetching && <div>Updating in background...</div>}
        </>
      )}
      {queryInfo.isLoading && 'Loading'}
      {queryInfo.error?.message}
    </div>
  )
}
