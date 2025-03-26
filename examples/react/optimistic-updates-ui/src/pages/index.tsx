import * as React from 'react'
import {
  QueryClient,
  QueryClientProvider,
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

function useTodos() {
  return useQuery({ queryKey: ['todos'], queryFn: fetchTodos })
}

function Example() {
  const queryClient = useQueryClient()
  const [text, setText] = React.useState('')
  const todoQuery = useTodos()

  const addTodoMutation = useMutation({
    mutationFn: async (newTodo: string) => {
      const response = await fetch('/api/data', {
        method: 'POST',
        body: JSON.stringify({ text: newTodo }),
        headers: { 'Content-Type': 'application/json' },
      })
      if (!response.ok) {
        throw new Error('Something went wrong.')
      }
      return await response.json()
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
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
          setText('')
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
      {todoQuery.isSuccess && (
        <>
          <div>
            {/* The type of queryInfo.data will be narrowed because we check for isSuccess first */}
            Updated At: {new Date(todoQuery.data.ts).toLocaleTimeString()}
          </div>
          <ul>
            {todoQuery.data.items.map((todo) => (
              <li key={todo.id}>{todo.text}</li>
            ))}
            {addTodoMutation.isPending && (
              <li style={{ opacity: 0.5 }}>{addTodoMutation.variables}</li>
            )}
            {addTodoMutation.isError && (
              <li style={{ color: 'red' }}>
                {addTodoMutation.variables}
                <button
                  onClick={() =>
                    addTodoMutation.mutate(addTodoMutation.variables)
                  }
                >
                  Retry
                </button>
              </li>
            )}
          </ul>
          {todoQuery.isFetching && <div>Updating in background...</div>}
        </>
      )}
      {todoQuery.isPending && 'Loading'}
      {todoQuery.error instanceof Error && todoQuery.error.message}
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
