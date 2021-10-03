---
id: quick-start
title: Quick Start
---

This example very briefly illustrates the 3 core concepts of React Query:

- [Queries](./guides/queries)
- [Mutations](./guides/mutations)
- [Query Invalidation](./guides/query-invalidation)

#### Query Client
```js
import {
  QueryClient,
  QueryClientProvider,
} from 'react-query'

// Create a client
const queryClient = new QueryClient()

function App() {
  return (
    // Provide the client to your App
    <QueryClientProvider client={queryClient}>
    </QueryClientProvider>
  )
}
```

Here we are creating a client by creating a new instance of the `QueryClient` class.
A QueryClient can be used to interact directly with the underlying caches.


Next, we pass the instance to the `QueryClientProvider` which must be a parent to all components that use `react-query`.
It connects the queryClient with your application. This is quite similar to the `Provider` component that is given by `redux`.

Let's now create a todo component:

```js
import {
  useQuery,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
} from 'react-query'
import { getTodos, postTodo } from '../my-api'

// ...app component

function Todos() {
  // Access the client
  const queryClient = useQueryClient();

  // Queries
  const query = useQuery('todos', getTodos)

  return (
    <div>
      <ul>
        {query.data.map(todo => (
          <li key={todo.id}>{todo.title}</li>
        ))}
      </ul>
    </div>
  )
}

render(<App />, document.getElementById('root'))
```

In the `Todo` component, we start by accessing the queryClient we defined earlier using the `useQueryClient` hook.
A `query` listens to a source of data, in our case, the `getTodos` method.
The unique key you provide is used internally for re-fetching, caching, and sharing your queries throughout your application.

Queries are generally use with the `GET` HTTP method, mutations are used for HTTP methods like `POST`, `PUT` etc which modify data on the server.

Finally, let's add a button that adds a todo:
```js
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
} from 'react-query'
import { getTodos, postTodo } from '../my-api'

// ...app component

function Todos() {
  // Access the client
  const queryClient = useQueryClient();

  // Queries
  const query = useQuery('todos', getTodos)

  // Mutations
  const mutation = useMutation(postTodo, {
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries('todos')
    },
  })

  return (
    <div>
      <ul>
        {query.data.map(todo => (
          <li key={todo.id}>{todo.title}</li>
        ))}
      </ul>

      <button
        onClick={() => {
          mutation.mutate({
            id: Date.now(),
            title: 'Do Laundry',
          })
        }}
      >
        Add Todo
      </button>
    </div>
  )
}

render(<App />, document.getElementById('root'))
```

We begin by defining a `mutation` using the `useMutation` hook which takes in a function, and a config object.
The `postTodo` function will handle updating the data on the server.
The config object contains the `onSuccess` method in which we are re-fetching the todos using the unique key to update our todo list.

We have a button, which on being clicked triggers the `mutation` and passes in a new todo.
This todo is then passed into our `postData` method.
If all goes well, then `onSuccess` is called, the todos are re-fetched and UI updates.

These three concepts make up most of the core functionality of React Query. The next sections of the documentation will go over each of these core concepts in great detail.
