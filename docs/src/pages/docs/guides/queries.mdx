---
id: queries
title: Queries
---

## Query Basics

In React Query, a query is a declarative dependency on some asynchronous source of data.

To make a new query, call the `useQuery` hook with at least:

- A **unique key for the query**
- An **asynchronous function (or similar then-able)** to resolve the data

```js
import { useQuery } from 'react-query'

function App() {
  const info = useQuery('todos', fetchTodoList)
}
```

The **unique key** you provide is used internally for refetching, caching, deduping related queries.

The query `info` returned contains all information about the query and can be easily destructured and used in your component:

```js
function Todos() {
  const { isLoading, isError, data, error } = useQuery('todos', fetchTodoList)

  if (isLoading) {
    return <span>Loading...</span>
  }

  if (isError) {
    return <span>Error: {error.message}</span>
  }

  // also status === 'success', but "else" logic works, too
  return (
    <ul>
      {data.map(todo => (
        <li key={todo.id}>{todo.title}</li>
      ))}
    </ul>
  )
}
```

If booleans aren't your thing, you can also use the `status` string to do the same:

```js
function Todos() {
  const { status, data, error } = useQuery('todos', fetchTodoList)

  if (status === 'loading') {
    return <span>Loading...</span>
  }

  if (status === 'error') {
    return <span>Error: {error.message}</span>
  }

  // also status === 'success', but "else" logic works, too
  return (
    <ul>
      {data.map(todo => (
        <li key={todo.id}>{todo.title}</li>
      ))}
    </ul>
  )
}
```

## Query Keys

At its core, React Query manages query caching for you based on query keys. Query keys can be as simple as a string, or as complex as an array or nested object of values. As long as the key is serializable, and **unique to the query's data**, you can use it!

If you're learning React Query still, we suggest starting with using **strings** and **arrays with strings/numbers**, then working your way up to using more complex query keys.

### String-Only Query Keys

The simplest form of a key is actually not an array, but an individual string. When a string query key is passed, it is converted to an array internally with the string as the only item in the query key. This format is useful for:

- Generic List/Index resources
- Non-hierarchical resources

```js
// A list of todos
useQuery('todos', ...) // queryKey === ['todos']

// Something else, whatever!
useQuery('somethingSpecial', ...) // queryKey === ['somethingSpecial']
```

### Array Keys

When a query needs more information to uniquely describe its data, you can use an array with a string and any number of serializable objects to describe it. This is useful for:

- Specific resources
  - It's common to pass an ID, index, or other primitive
- Queries with additional parameters
  - It's common to pass an object of additional options

```js
// An individual todo
useQuery(['todo', 5], ...)
// queryKey === ['todo', 5]

// And individual todo in a "preview" format
useQuery(['todo', 5, { preview: true }], ...)
// queryKey === ['todo', 5, { preview: 'true' } }]

// A list of todos that are "done"
useQuery(['todos', { type: 'done' }], ...)
// queryKey === ['todos', { type: 'done' }]
```

### Query Keys are serialized deterministically!

This means that no matter the order of keys in objects, all of the following queries would result in the same final query key of `['todos', { page, status }]`:

```js
useQuery(['todos', { status, page }], ...)
useQuery(['todos', { page, status }], ...)
useQuery(['todos', { page, status, other: undefined }], ...)
```

The following query keys, however, are not equal. Array item order matters!

```js
useQuery(['todos', status, page], ...)
useQuery(['todos', page, status], ...)
useQuery(['todos', undefined, page, status], ...)
```

## Query Key Variables

To use external props, state, or variables in a query function, it's easiest to pass them as items in your array query keys! All query keys get passed through to your query function as parameters in the order they appear in the array key:

```js
function Todos({ completed }) {
  const queryInfo = useQuery(['todos', { status, page }], fetchTodoList)
}

// Access the key, status and page variables in your query function!
function fetchTodoList(key, { status, page }) {
  return new Promise()
  // ...
}
```

If you send through more items in your query key, they will also be available in your query function:

```js
function Todo({ todoId, preview }) {
  const queryInfo = useQuery(['todo', todoId, { preview }], fetchTodoById)
}

// Access status and page in your query function!
function fetchTodoById(key, todoId, { preview }) {
  return new Promise()
  // ...
}
```

Whenever a query's key changes, the query will automatically update. In the following example, a new query is created whenever `todoId` changes:

```js
function Todo({ todoId }) {
  const queryInfo = useQuery(['todo', todoId], fetchTodo)
}
```

## Using a Query Object instead of parameters

Anywhere the `[queryKey, queryFn, config]` signature is supported throughout React Query's API, you can also use an object to express the same configuration:

```js
import { useQuery } from 'react-query'

useQuery({
  queryKey: ['todo', 7],
  queryFn: fetchTodo,
  config: {},
})
```

## Parallel Queries

React Query is built to require **no extra effort** for making parallel queries. You don't need to do anything special! Just use React Query's hooks and handle all of the loading states and you're good to go!

## Dependent Queries

Dependent (or serial) queries are queries that depend on previous ones to finish before they can execute. To do this, use the `enabled` option to tell a query when it is ready to turn on:

```js
// Get the user
const { data: user } = useQuery(['user', email], getUserByEmail)

// Then get the user's projects
const { isIdle, data: projects } = useQuery(
  ['projects', user.id],
  getProjectsByUser,
  {
    // `user` would be `null` at first (falsy),
    // so the query will not execute until the user exists
    enabled: user,
  }
)

// isIdle will be `true` until `enabled` is true and the query begins to fetch.
// It will then go to the `isLoading` stage and hopefully the `isSuccess` stage :)
```

# Displaying Background Fetching Loading States

A query's `status === 'loading'` state is sufficient enough to show the initial hard-loading state for a query, but sometimes you may want to display an additional indicator that a query is refetching in the background. To do this, queries also supply you with an `isFetching` boolean that you can use to show that it's in a fetching state, regardless of the state of the `status` variable:

```js
function Todos() {
  const { status, data: todos, error, isFetching } = useQuery(
    'todos',
    fetchTodos
  )

  return status === 'loading' ? (
    <span>Loading...</span>
  ) : status === 'error' ? (
    <span>Error: {error.message}</span>
  ) : (
    <>
      {isFetching ? <div>Refreshing...</div> : null}

      <div>
        {todos.map(todo => (
          <Todo todo={todo} />
        ))}
      </div>
    </>
  )
}
```

# Displaying Global Background Fetching Loading State

In addition to individual query loading states, if you would like to show a global loading indicator when **any** queries are fetching (including in the background), you can use the `useIsFetching` hook:

```js
import { useIsFetching } from 'react-query'

function GlobalLoadingIndicator() {
  const isFetching = useIsFetching()

  return isFetching ? (
    <div>Queries are fetching in the background...</div>
  ) : null
}
```
