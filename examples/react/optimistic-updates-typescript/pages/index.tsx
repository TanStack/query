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
import { ReactQueryDevtools } from 'react-query/devtools'

const client = new QueryClient()

type Todos = {
  items: readonly {
    id: string
    text: string
  }[]
  ts: number
}

async function fetchTodos(): Promise<Todos> {
  const res = await axios.get('/api/data')
  return res.data
}

function useTodos<TData = Todos>(
  options?: UseQueryOptions<Todos, AxiosError, TData>
) {
  return useQuery('todos', fetchTodos, options)
}

function TodoCounter() {
  // subscribe only to changes in the 'data' prop, which will be the
  // amount of todos because of the select function
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
    newTodo => axios.post('/api/data', { text: newTodo }),
    {
      // When mutate is called:
      onMutate: async (newTodo: string) => {
        setText('')
        // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
        await queryClient.cancelQueries('todos')

        // Snapshot the previous value
        const previousTodos = queryClient.getQueryData<Todos>('todos')

        // Optimistically update to the new value
        if (previousTodos) {
          queryClient.setQueryData<Todos>('todos', {
            ...previousTodos,
            items: [
              ...previousTodos.items,
              { id: Math.random().toString(), text: newTodo },
            ],
          })
        }

        return { previousTodos }
      },
      // If the mutation fails, use the context returned from onMutate to roll back
      onError: (err, variables, context) => {
        if (context?.previousTodos) {
          queryClient.setQueryData<Todos>('todos', context.previousTodos)
        }
      },
      // Always refetch after error or success:
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

export default function App() {
  return (
    <QueryClientProvider client={client}>
      <Example />
      <TodoCounter />
      <ReactQueryDevtools initialIsOpen />
    </QueryClientProvider>
  )
}
