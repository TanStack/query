# React Query ⚛️🐧

<a href="https://travis-ci.org/tannerlinsley/react-query" target="\_parent">
  <img alt="" src="https://travis-ci.org/tannerlinsley/react-query.svg?branch=master" />
</a>
<a href="https://npmjs.com/package/react-query" target="\_parent">
  <img alt="" src="https://img.shields.io/npm/dm/react-query.svg" />
</a>
<a href="https://github.com/tannerlinsley/react-query" target="\_parent">
  <img alt="" src="https://img.shields.io/github/stars/tannerlinsley/react-query.svg?style=social&label=Star" />
</a>
<a href="https://twitter.com/tannerlinsley" target="\_parent">
  <img alt="" src="https://img.shields.io/twitter/follow/tannerlinsley.svg?style=social&label=Follow" />
</a>

Hooks for managing asynchronous data in React

## The problem

Tools for managing promises or normalized client stores/caches are plentiful these days, but most of these tools:

- Don't dedupe network operations that could be made in a single request
- Force denormalization or custom caching strategies on your data
- Don't invalidate their cache often enough or don't offer sane defaults to do so
- Because of this ☝️, they require imperative interaction to invalidate or manage their caches
- Don't perform optimistic updates across the network

## The solution

React Query contains a set of hooks that attempt to address these issues. Ouf of the box, React Query:

- Dedupes similar requests at the application level
- Caches response data across similar requests
- Optimistically updates cached requests
- Automatically manages and garbage collects unused cache data
- Supports retries and even exponential/custom back-off delays
- Provides a declarative API for invalidating and managing cached responses.
- Built with and for React hooks
- 7kb gzipped

## Hat Tipping

A big thanks to [Draqula](https://github.com/vadimdemedes/draqula) for inspiring a lot of React Query's API and documentation. You rock!

## Demos

- [A contrived CodeSandbox example](https://codesandbox.io/s/github/tannerlinsley/react-query/tree/master/example)

# Documentation

## Installation

```bash
$ yarn add @tannerlinsley/react-query-temp
# or
$ npm i @tannerlinsley/react-query-temp --save
```

## ReactQueryProvider

The `ReactQueryProvider` is a provider component that is necessary to use React Query. Render it at the base of your application like so:

```js
import { ReactQueryProvider } from '@tannerlinsley/react-query-temp'

function App() {
  ;<ReactQueryProvider>...</ReactQueryProvider>
}
```

### Optional Configuration

You may also pass a config object to `ReactQueryProvider` as well to customize the default behavior of hooks like `useQuery` and `useMutation` used within it:

```js
const config = {
  // These are the default config options for the ReactQueryProvider
  retry: 3,
  retryDelay: attempt =>
    Math.min(attempt > 1 ? 2 ** attempt * 1000 : 1000, 30 * 1000),
  defaultMerge: (old, data) => [...old, ...data],
  cacheTime: 60 * 1000,
}

function App() {
  ;<ReactQueryProvider config={config}>...</ReactQueryProvider>
}
```

## Queries

### Basic queries

To perform a simple query without any options, simply pass the `useQuery` hook an **asynchronous function (or similar then-able)**:

```js
import { useQuery } from '@tannerlinsley/react-query-temp'

import fetchTodoList from './queries/fetchTodoList'

function Todos() {
  const { data, isLoading, error } = useQuery(fetchTodoList)

  return (
    <div>
      {isLoading ? (
        <span>Loading...</span>
      ) : error ? (
        <span>Error: {error.message}</span>
      ) : data ? (
        <ul>
          {data.map(todo => (
            <li key={todo.id}>{todo.title}</li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
```

### Query Variables

Using variables is as easy as passing a variables object to the query configuration:

```js
const { data, isLoading, error } = useQuery(fetchTodoList, {
  variables: {
    status: 'done',
  },
})
```

Whenever variables are updated, `useQuery` will automatically refetch and update the query for you:

```js
function Todos() {
  const [page, setPage] = useState(0)

  const { data, isLoading, error } = useQuery(fetchTodoList, {
    variables: { page },
  })

  const onNextPage = () => {
    setPage(page => page + 1)
  }

  return (
    <>
      {/* ... */}
      <button onClick={onNextPage}>Load next page</button>
    </>
  )
}
```

If the same query (with the same variables) is used anywhere else in your application, it will get optimistically updated with the response

> **Hint:** Query functions **must be declared outside of the component** so as to maintain a single instance across your entire application. React Query uses query function equality to detect similar queries and cache responses.

### Caching

React Query caching is automatic and invalidates data very aggressively. It uses optimistic updates and short-term caching across similar queries to always ensure your query's data is only stored once, quickly available and kept up to date with the server.

At a glance:

- Caching is automatic and aggressive by default.
- You can configure the `cacheTime` option that determines how long inactive cache data is kept before it is purged.
- The cache is keyed on unique `query + variables` combinations.
- Data is not normalized or stored outside of the context of its usage.
- Caching can be turned off either globally or individually for each query

> **Did You Know?** - Because React Query doesn't use document normalization in its cache (made popular with libraries like Apollo and Redux-Query), it eliminates a whole range of common issues with caching like incorrect data merges, failed cache reads/writes, and imperative maintenance of the cache.

Here is a more detailed example of the caching lifecycle:

- A new usage of `useQuery(fetchTodoList, { page: 1 })` mounts
  - Since no other queries have been made with this query + variable combination, this query will show a hard loading state and make a network request to fetch the data.
  - It will then cache the data using `fetchTodoList` and `{ page: 1 }` as the unique identifiers for that cache.
- Another instance of `useQuery(fetchTodoList, { page: 1 })` mounts elsewhere
  - Because this exact data has already been cached from the other existing query, that data is immediately returned
  - Despite having the data in the cache, the query function is called again to optimistically update the data for this query in the background
  - Both this instance and the first instance of this query get optimistically updated with the new data from the background request
- Both instances of the `useQuery(fetchTodoList, { page: 1 })` query unmount.
  - Since there are no more active instances to this query combination, a timeout is set to expire its cache using the `cacheTime` option (defaults to `60 * 1000` milliseconds)
- No more instances of `useQuery(fetchTodoList, { page: 1 })` appear within the timeout
  - The cache for the this query is deleted and garbage collected.

### Pagination

If all you need is page-based pagination, where the previous set of data is replaced with a new one, this section is not applicable to your use-case. For that, you can simply increment the page variable and pass it to your query via variables.

However, if your app needs to add more data to the list along with existing one (for example, infinite loading), React Query provides you with a way to fetch additional data without deleting the current data. Let's use page-based pagination for simplicity, but assume that we want to append new todo items at the end of the list.

```js
function Todos() {
  const { data, isLoading, error, refetch, isFetching } = useQuery(
    fetchTodoList,
    {
      page: 1,
    }
  )

  const onFetchMore = () => {
    refetch({
      variables: { page: data.pagination.nextPage },
      merge: (prev, next) => ({
        ...next,
        // Merge the new todos with the existing ones
        todos: [...prev.todos, ...next.todos],
      }),
    })
  }

  return (
    <>
      {isLoading && <span>Loading…</span>}
      {error && <span>Error: {error.message}</span>}
      {data && (
        <ul>
          {data.todos.map(todo => (
            <li key={todo.id}>{todo.title}</li>
          ))}
        </ul>
      )}
      {data.pagination.hasMore && (
        <button disabled={isFetching} onClick={onFetchMore}>
          {isFetching ? 'Loading more todos...' : 'Load more todos'}
        </button>
      )}
    </>
  )
}
```

To prevent you from managing the loading state of `refetch` manually (since `isLoading` will remain false when `refetch` is called), React Query exposes an `isFetching` variable. It's the same as `isLoading`, but only reflects the state of the actual fetch operation for the query.

### Retries

When a `useQuery` query fails (the function throws an error), React Query will automatically retry the query if that query's request has not reached the max number of consecutive retries (defaults to `3`).

You can configure retries both on a global level and an individual query level.

- Setting `retry = false` will disable retries
- Setting `retry = 6` will retry failing requests 6 times before showing the final error thrown by the function
- Setting `retry = true` will infinitely retry failing requests.

```js
// Turn off retries for all queries
const config = {
  retry: false,
}

function App() {
  return (
    <ReactQueryProvider config={config}>
      <Stuff />
    </ReactQueryProvider>
  )
}

// Make specific query retry a certain number of times
const { data, isLoading, error } = useQuery(fetchTodoList, {
  variables: { page: 1 },
  retry: 10, // Will retry failed requests 10 times before displaying an error
})
```

### Retry Delay with `retryDelay`

By default, retries in React Query do not happen immediately after a request fails. As is standard, a back-off delay is gradually applied to each retry attempt.

The default `retryDelay` is set to double (starting at `1000`ms) with each attempt, but not exceed 30 seconds:

```js
// Configure for all queries
const config = {
  retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
}

function App() {
  return (
    <ReactQueryProvider config={config}>
      <Stuff />
    </ReactQueryProvider>
  )
}
```

Though it is not recommended, you can obviously override the `retryDelay` function/integer in both the Provider and individual query options. If set to an integer instead of a function the delay will always be the same amount of time:

```js
const { data, isLoading, error } = useQuery(fetchTodoList, {
  retryDelay: 10000, // Will always wait 1000ms to retry, regardless of how many retries
})
```

## Mutations

Unlike queries, mutations are typically used to create/update/delete data or perform server side-effects. For this purpose, React Query offers a `useMutation` hook. Just like queries, remember to define your mutations outside your components to prevent infinite unnecessary rerenders.

### Basic Mutations

Assuming the server implements a ping mutation, that simply returns "pong" string, here's an example of the most basic mutation:

```js
// pingMutation is a function that returns a promise
import pingMutation from '../queries/pingMutation'

const PingPong = () => {
  const [mutate, { data, isLoading, error }] = useMutation(pingMutation)

  const onPing = async () => {
    const data = await mutate()
    console.log(data)
    // { ping: 'pong' }
  }
  return <button onClick={onPing}>Ping</button>
}
```

Mutations without variables are not that useful, so let's add some variables to closer match reality.

### Mutation Variables

Similar to `useQuery`, `useMutation` also accepts variables. The only difference is that you pass `variables` to the `mutate` function, instead of the `useMutation` hook:

```js
import createTodo from '../mutations/createTodo'

const CreateTodo = () => {
  const [title, setTitle] = useState('')
  const [mutate] = useMutation(createTodo)

  const onCreateTodo = async e => {
    // Prevent the form from refreshing the page
    e.preventDefault()

    try {
      await mutate({ title })
      // Todo was successfully created
    } catch (error) {
      // Uh oh, something went wrong
    }
  }

  return (
    <form onSubmit={onCreateTodo}>
      <input
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
      />
      <br />
      <button type="submit">Create Todo</button>
    </form>
  )
}
```

### Refetching Queries from Mutations

When a mutation succeeds, it's likely that other queries in your application need to update. For example, a successful `postTodo` mutation will likely require that any `fetchTodoList` queries get updated to show the new todo item.

Where other libraries that use normalized caches would attempt to update locale queries with the new data imperatively, React Query avoids the pitfalls that come with normalized caches and uses **atomic updates** instead of partial manipulation of caches.

To automatically refetch queries after a mutation succeeds, you can use the `useMutation` hook's `refetchQueries` option:

```js
import fetchTodoList from '../queries/fetchTodoList'
import createTodo from '../mutations/createTodo'

// When this mutation succeeds, any query relying on `fetchTodoList` query will be refetched
const [mutate] = useMutation(createTodo, { refetchQueries: [fetchTodoList] })

// The 2 queries below will be refetched when the mutation above succeeds
const { data, isLoading, error } = useQuery(fetchTodoList)
const { data, isLoading, error } = useQuery(fetchTodoList, {
  variables: { status: 'done' },
})
```

It's easy to refetch multiple queries too:

```js
import fetchTodoList from '../queries/fetchTodoList'
import fetchReminders from '../queries/fetchReminders'
import createTodo from '../mutations/createTodo'

// When this mutation succeeds, any query relying on `fetchTodoList` query will be refetched
const [mutate] = useMutation(createTodo, {
  refetchQueries: [fetchTodoList, fetchReminders],
})

// The 2 queries below will be refetched when the mutation above succeeds
const todoListQuery = useQuery(fetchTodoList)
const remindersQuery = useQuery(fetchReminders)
```

You can even refetch queries with specific variables by passing objects to `refetchQueries`

```js
import fetchTodoList from '../queries/fetchTodoList'
import addTodo from '../mutations/addTodo'

// You can lazily pass invalidation options to the `mutate` function instead
const [mutate] = useMutation(addTodo, {
  refetchQueries: [
    {
      query: fetchTodoList,
      variables: {
        type: 'done',
      },
    },
  ],
})

// The query below will be refetched when the mutation above succeeds
const { data, isLoading, error } = useQuery(fetchTodoList, {
  variables: {
    type: 'done',
  },
})

// The query below will NOT be refetched when the mutation succeeds
const { data, isLoading, error } = useQuery(fetchTodoList)
```

If you prefer that the promise returned from `mutate()` only resolves **after** any `refetchQueries` have been refetched, you can set `waitForRefetchQueries = true`:

```js
const [mutate] = useMutation(addTodo, {
  waitForRefetchQueries: true,
  refetchQueries: [
    {
      query: fetchTodoList,
      variables: {
        type: 'done',
      },
    },
  ],
})

const run = async () => {
  await mutate(todo)
  console.log('I will only log after all refetchQueries are done refetching!')
}
```

You can also lazily define mutation options with the `mutate` function:

```js
const [mutate] = useMutation(addTodo)

// Wait to call the function to define the refetchQueries
mutate(todo, {
  refetchQueries: [fetchTodoList],
})
```

### Query Updates from Mutations

Normally when dealing with REST calls that **update** objects on the server, the updated version of that object is returned in the response. Instead of invalidating queries that would return that same object and wasting a network call, we can update query responses that match that exact object query using the `updateQueries` option:

> **NOTE:** The `updatedQueries` option can only be passed to the `mutate` function. Passing it to `useMutation` will have no effect

```js
import fetchTodoByID from '../queries/fetchTodoByID'
import editTodo from '../mutations/editTodo'

const [mutate] = useMutation(editTodo)

const saveTodo = async todo => {
  await mutate(todo, {
    updateQueries: [
      {
        query: fetchTodoByID,
        variables: {
          id: todo.id,
        },
      },
    ],
  })
}

saveTodo({
  id: 5,
  name: 'Do the laundry',
})

// The query below will be updated with the response from the mutation above when it succeeds
const { data, isLoading, error } = useQuery(fetchTodoList, {
  variables: {
    id: 5,
  },
})
```

## API

Detailed API documentation is coming ASAP.
