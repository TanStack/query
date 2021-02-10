import React, { useState } from 'react'
import ReactDOM from 'react-dom'
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
} from 'react-query'

const client = new QueryClient()
const API_DELAY = 4000

type TodoItem = {
  text: string
}

type TodoResponseSuccess = {
  list?: TodoItem[]
  data?: string
}

type TodoResponseError = {
  error: string
}

const data: TodoItem[] = []

export const App = () => {
  const [name, setName] = useState('')
  const {
    data: todos,
    isLoading: getTodoLoading,
    error: getTodosError,
  } = useQuery<TodoResponseSuccess, TodoResponseError>(
    'listUser',
    () => getTodos(),
    {
      retry: false,
      refetchOnWindowFocus: false,
    }
  )
  const {
    mutateAsync: addTodoAsync,
    status: addTodoStatus,
    error: addTodoError,
  } = useMutation<TodoResponseSuccess, TodoResponseError, TodoItem>(
    'add-todo',
    ({ text }) => addTodo({ text }),
    {
      onSuccess: () => setName(''),
    }
  )

  if (getTodoLoading) {
    return <h1>Loading...</h1>
  }

  return (
    <>
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        disabled={addTodoStatus === 'loading'}
      />
      <button
        onClick={() => {
          addTodoAsync({ text: name })
        }}
        disabled={addTodoStatus === 'loading' || !name}
      >
        Add Todo
      </button>
      <hr />
      {todos?.list?.map((todo: TodoItem, index: number) => (
        <li key={index}>{todo.text}</li>
      ))}
    </>
  )
}

function getTodos(): Promise<TodoResponseSuccess> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve({ list: data })
    }, API_DELAY)
  })
}
function addTodo(todo: TodoItem): Promise<TodoResponseSuccess> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      data.push(todo)
      resolve({
        data: 'Todo Saved',
      })
    }, API_DELAY)
  })
}

ReactDOM.render(
  <QueryClientProvider client={client}>
    <App />
  </QueryClientProvider>,
  document.getElementById('root')
)
