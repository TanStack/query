import * as React from 'react'

import {
  QueryClient,
  QueryClientProvider,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

const client = new QueryClient()

type Todos = {
  items: ReadonlyArray<{
    id: string
    text: string
  }>
  ts: number
}

async function fetchTodos(): Promise<Todos> {
  const response = await fetch('/api/data')
  return await response.json()
}

const todoListOptions = queryOptions({
  queryKey: ['todos'],
  queryFn: fetchTodos,
})

function Example() {
  const queryClient = useQueryClient()
  const [text, setText] = React.useState('')
  const { isFetching, ...queryInfo } = useQuery(todoListOptions)

  const addTodoMutation = useMutation({
    mutationFn: async (newTodo: string) => {
      const response = await fetch('/api/data', {
        method: 'POST',
        body: JSON.stringify({ text: newTodo }),
        headers: { 'Content-Type': 'application/json' },
      })
      return await response.json()
    },
    // When mutate is called:
    onMutate: async (newTodo: string) => {
      setText('')
      // Cancel any outgoing refetch
      // (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries(todoListOptions)

      // Snapshot the previous value
      const previousTodos = queryClient.getQueryData(todoListOptions.queryKey)

      // Optimistically update to the new value
      if (previousTodos) {
        queryClient.setQueryData(todoListOptions.queryKey, {
          ...previousTodos,
          items: [
            ...previousTodos.items,
            { id: Math.random().toString(), text: newTodo },
          ],
        })
      }

      return { previousTodos }
    },
    // If the mutation fails,
    // use the context returned from onMutate to roll back
    onError: (err, variables, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData<Todos>(['todos'], context.previousTodos)
      }
    },
    // Always refetch after error or success:
    onSettled: async () => {
      return await queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })

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
        onSubmit={(e) => {
          e.preventDefault()
          addTodoMutation.mutate(text)
        }}
      >
        <input
          type="text"
          onChange={(event) => setText(event.target.value)}
          value={text}
        />
        <button disabled={addTodoMutation.isPending}>Create</button>
      </form>
      <br />
      {queryInfo.isSuccess && (
        <>
          <div>
            {/* The type of queryInfo.data will be narrowed because we check for isSuccess first */}
            Updated At: {new Date(queryInfo.data.ts).toLocaleTimeString()}
          </div>
          <ul>
            {queryInfo.data.items.map((todo) => (
              <li key={todo.id}>{todo.text}</li>
            ))}
          </ul>
          {isFetching && <div>Updating in background...</div>}
        </>
      )}
      {queryInfo.isLoading && 'Loading'}
      {queryInfo.error instanceof Error && queryInfo.error.message}
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={client}>
      <Example />
      <ReactQueryDevtools initialIsOpen />
    </QueryClientProvider>
  )
}
