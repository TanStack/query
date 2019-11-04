![React Query Header](https://github.com/tannerlinsley/react-query/raw/master/media/header.png)

<img src='https://github.com/tannerlinsley/react-query/raw/master/media/logo.png' width='300'/>

Hooks for fetching, caching and updating asynchronous data in React

<!-- <a href="https://travis-ci.org/tannerlinsley/react-query" target="\_parent">
  <img alt="" src="https://travis-ci.org/tannerlinsley/react-query.svg?branch=master" />
</a> -->
<a href="https://npmjs.com/package/react-query" target="\_parent">
  <img alt="" src="https://img.shields.io/npm/dm/react-query.svg" />
</a>
<a href="https://bundlephobia.com/result?p=react-query" target="\_parent">
  <img alt="" src="https://badgen.net/bundlephobia/minzip/react-query" />
</a>
<a href="https://spectrum.chat/react-query">
  <img alt="Join the community on Spectrum" src="https://withspectrum.github.io/badge/badge.svg" />
</a>
<a href="https://github.com/tannerlinsley/react-query" target="\_parent">
  <img alt="" src="https://img.shields.io/github/stars/tannerlinsley/react-query.svg?style=social&label=Star" />
</a>
<a href="https://twitter.com/tannerlinsley" target="\_parent">
  <img alt="" src="https://img.shields.io/twitter/follow/tannerlinsley.svg?style=social&label=Follow" />
</a>
<br />
<br />
<a href="https://patreon.com/tannerlinsley">
  <img width="180" alt="" src="https://raw.githubusercontent.com/tannerlinsley/files/master/images/patreon/become-a-patron.png" />
</a>

## Quick Features

- Transport, protocol & backend agnostic data fetching
- Auto Caching + Background Refetching (stale-while-revalidate model)
- Auto Refetch (on-window-focus, when-stale, polling)
- Parallel + Dependent Queries
- Mutations
- Multi-layer Cache + Garbage Collection
- 3.6 kb (minzipped)

## The Challenge

Tools for managing async data and client stores/caches are plentiful these days, but most of these tools:

- Duplicate unnecessary network operations
- Force normalized or object/id-based caching strategies on your data
- Don't invalidate their caches often enough or don't ship with good defaults or mechanisms to do so
- Don't perform optimistic updates, or require setup to know when to perform them
- Because of this ☝️, they require imperative interaction to invalidate or manage their caches

## The Solution

React Query exports a set of hooks that attempt to address these issues. Out of the box, React Query:

- Flexibly dedupes simultaneous requests to assets
- Automatically caches request responses
- Automatically invalidates stale cache data
- Optimistically updates stale requests in the background
- Optimistically seeds new requests from stale data while fetching new dat
- Supports automatic retries and exponential or custom back-off delays
- Provides both declarative and imperative API's for:
  - Manually invalidating requests
  - Atomically updating cached responses

## Hat Tipping

A big thanks to both [Draqula](https://github.com/vadimdemedes/draqula) for inspiring a lot of React Query's original API and documentation and also [Zeit's SWR](https://github.com/zeit/swr) and it's creators for inspiring even further customizations and optimizations. You all rock!

## Demos

- [A contrived CodeSandbox example](https://codesandbox.io/s/github/tannerlinsley/react-query/tree/master/example)

# Documentation

- [Installation](#installation)
- [Queries](#queries)
  - [Query Keys](#query-keys)
  - [Query Variables](#query-variables)
  - [Dependent Queries](#dependent-queries)
  - [Caching & Invalidation](#caching--invalidation)
  - [Pagination](#pagination)
  - [Manual Querying](#manual-querying)
  - [Retries](#retries)
  - [Retry Delay](#retry-delay)
- [Mutations](#mutations)
  - [Basic Mutations](#basic-mutations)
  - [Mutation Variables](#mutation-variables)
  - [Invalidate and Refetch Queries from Mutations](#invalidate-and-refetch-queries-from-mutations)
  - [Query Updates from Mutations](#query-updates-from-mutations)
- [Manually or Optimistically Setting Query Data](#manually-or-optimistically-setting-query-data)
- [Displaying Background Fetching Loading States](#displaying-background-fetching-loading-states)
- [Displaying Global Background Fetching Loading State](#displaying-global-background-fetching-loading-state)
- [Window-Focus Refetching](#window-focus-refetching)
- [API](#api)
  - [`useQuery`](#usequery)
  - [`useMutation`](#usemutation)
  - [`setQueryData`](#setquerydata)
  - [`refetchQuery`](#refetchquery)
  - [`refetchAllQueries`](#refetchallqueries)
  - [`useIsFetching`](#useisfetching)
  - [`useReactQueryConfig`](#usereactqueryconfig)

## Installation

```bash
$ npm i --save react-query
# or
$ yarn add react-query
```

## Queries

To make a new query, call the `useQuery` hook with:

- A **unique key for the query**
- An **asynchronous function (or similar then-able)** to resolve the data

```js
const info = useQuery('todos', fetchTodoList)
```

The **unique key** you provide is used internally for refetching, caching, deduping related queries.

This key can be whatever you'd like it to be as long as:

- It changes when your query should be requested again
- It is consistent across all instances of that specific query in your application

The query `info` returned contains all information about the query and can be easily destructured and used in your component:

```js
function Todos() {
  const { data, isLoading, error } = useQuery('todos', fetchTodoList)

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

### Query Keys

Since React Query uses a query's **unique key** for essentially everything, it's important to tailor them so that will change with your query requirements. In other libraries like Zeit's SWR, you'll see the use of URL's and GraphQL query template strings to achieve this, but we believe at scale, this becomes prone to typos and errors. To relieve this issue, you can pass a **tuple key** with a `string` and `object` of variables to deterministically get the the same key.

> Pro Tip: Variables passed in the key are automatically passed to your query function!

All of the following queries would result in using the same key:

```js
useQuery(['todos', { status, page }])
useQuery(['todos', { page, status }])
useQuery(['todos', { page, status, other: undefined }])
```

> Note: To aid you in your quest, if a query key is used that contains a `?` (like `todos?page=${page}&status=${status}`), you will see a gentle console warning to use the above format instead.

### Query Variables

To use external props, state, or variables in a query function, pass them as a variables in your query key! They will be passed through to your query function as the first parameter.

```js
function Todos({ status }) {
  const { data, isLoading, error } = useQuery(
    ['todos', { status, page }],
    fetchTodoList // This is the same as `fetchTodoList({ status, page })`
  )
}
```

Whenever a query's key changes, the query will automatically update:

```js
function Todos() {
  const [page, setPage] = useState(0)

  const { data, isLoading, error } = useQuery(
    ['todos', { page }],
    fetchTodoList
  )

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

### Dependent Queries

React Query makes it easy to make queries that depends on other queries for both:

- Parallel Queries (avoiding waterfalls) and
- Serial Queries (when a piece of data is required for the next query to happen.

To do this effectively, you can use the following 2 approaches:

#### Pass a falsey query key

If a query isn't ready to be requested yet, just pass a falsey value as the query key:

```js
const { data: user } = useQuery(['user', { userId }])
const { data: projects } = useQuery(user && ['projects', { userId: user.id }]) // User is `null`, so the query key will be falsey
```

#### Use a query key function

If a function is passed, the query will not execute until the function can be called without throwing:

```js
const { data: user } = useQuery(['user', { userId }])
const { data: projects } = useQuery(() => ['projects', { userId: user.id }]) // This will throw until `user` is available
```

#### Mix them together!

```js
const [ready, setReady] = React.useState(false)
const { data: user } = useQuery(ready && ['user', { userId }]) // Wait for ready
const { data: projects } = useQuery(
  () => ready && ['projects', { userId: user.id }] // Wait for ready and user.id
```

### Caching & Invalidation

React Query caching is automatic and uses optimistic updates and short-term caching across similar queries to always ensure a query's data is only stored once, quickly available and kept up to date with the server.

At a glance:

- Caching is automatic dand aggressive by default.
- The cache is keyed on unique `query + variables` combinations.
- You can configure the `cacheTime` option that determines how long cache data is considered fresh before it is marked as stale
- You can configure the `inactiveCacheTime` option that determines how long unused stale cache data is kept around before it is garbage collected
- Stale queries are optimistically and automatically updated when new instances of that query mount or variables change
- If stale or unused cache data that has not been garbage collected is available, it will be used as a cold-start cache for queries while they are updated.
- Data is not normalized or stored outside of the context of its usage.
- Caching can be turned off either globally or individually for each query

> **Did You Know?** - Because React Query doesn't use document normalization in its cache (made popular with libraries like Apollo and Redux-Query), it eliminates a whole range of common issues with caching like incorrect data merges, failed cache reads/writes, and imperative maintenance of the cache.

<details>
 <summary>A more detailed example of the caching lifecycle</summary>

- A new usage of `useQuery(fetchTodoList, { page: 1 })` mounts
  - Since no other queries have been made with this query + variable combination, this query will show a hard loading state and make a network request to fetch the data.
  - It will then cache the data using `fetchTodoList` and `{ page: 1 }` as the unique identifiers for that cache.
  - A cache expiration is scheduled for later using the `cacheTime` option as a delay (defaults to `10 * 1000` milliseconds or `10` seconds).
- A second instance of `useQuery(fetchTodoList, { page: 1 })` mounts elsewhere
  - Because this exact data exist in the cache from the first instance of this query, that data is immediately returned from the cache
- `10` seconds pass since the data came in for the first instance of this query
  - The data for these queries is marked as outdated
- A third instance of `useQuery(fetchTodoList, { page: 1 })` mounts elsewhere
  - Because this exact data exist in the cache from the first and second instances of this query, that data is immediately returned from the cache
  - However, since the data has been marked as outdated, a background request is made to updated the stale data
  - Both this instance and the other first and second instances of this query get optimistically updated with the new data from the background request
  - A new cache expiration is scheduled for later using the `cacheTime` option as a delay.
- All 3 instances of the `useQuery(fetchTodoList, { page: 1 })` query unmount.
  - Since there are no more active instances to this query combination, a fallback timeout is set using `inactiveCacheTime` to garbage collect the cache (defaults to `10 * 1000` milliseconds or `10` seconds).
  - If there is an active cache expiration scheduled already, it will be used instead.
- No more instances of `useQuery(fetchTodoList, { page: 1 })` appear within the timeout
  - The cache for the this query is deleted and garbage collected.

</details>

### Pagination

If all you need is page-based pagination, where the previous set of data is replaced with a new one, this section is not applicable to your use-case. For that, you can increment the page variable and pass it to your query via variables.

However, if your app needs to add more data to the list along with existing one (for example, infinite loading), React Query provides you with a way to fetch additional data without deleting the current data. Let's use page-based pagination for simplicity, but assume that we want to append new todo items at the end of the list.

```js
function Todos() {
  const { data, isLoading, error, refetch, isFetching } = useQuery(
    ['todos', { page: 1 }],
    fetchTodoList
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

  return isLoading ? (
    <span>Loading...</span>
  ) : error ? (
    <span>Error: {error.message}</span>
  ) : data ? (
    <>
      <ul>
        {data.todos.map(todo => (
          <li key={todo.id}>{todo.title}</li>
        ))}
      </ul>
      {data.pagination.hasMore && (
        <button disabled={isFetching} onClick={onFetchMore}>
          {isFetching ? 'Loading more todos...' : 'Load more todos'}
        </button>
      )}
    </>
  ) : null
}
```

To prevent you from managing the loading state of `refetch` manually (since `isLoading` will remain false when `refetch` is called), React Query exposes an `isFetching` variable. It's the same as `isLoading`, but only reflects the state of the actual fetch operation for the query.

### Manual Querying

If you ever want to disable a query from automatically running, you can use the `manual = true` option. When `manual` is set to true:

- The query will not automatically refetch due to changes to their query function or variables.
- The query will not automatically refetch due to `refetchQueries` options in other queries or via `useRefetchQuery` calls.

```js
function Todos() {
  const { data, isLoading, error, refetch, isFetching } = useQuery(
    'todos',
    fetchTodoList,
    {
      manual: true,
    }
  )

  return (
    <>
      <button onClick={() => refetch()}>Fetch Todos</button>

      {isLoading ? (
        <span>Loading...</span>
      ) : error ? (
        <span>Error: {error.message}</span>
      ) : data ? (
        <>
          <ul>
            {data.map(todo => (
              <li key={todo.id}>{todo.title}</li>
            ))}
          </ul>
        </>
      ) : null}
    </>
  )
}
```

> Pro Tip: Don't use `manual` for dependent queries. Use [Dependent Queries](#dependent-queries) instead!

### Retries

When a `useQuery` query fails (the function throws an error), React Query will automatically retry the query if that query's request has not reached the max number of consecutive retries (defaults to `3`).

You can configure retries both on a global level and an individual query level.

- Setting `retry = false` will disable retries
- Setting `retry = 6` will retry failing requests 6 times before showing the final error thrown by the function
- Setting `retry = true` will infinitely retry failing requests.

```js
import { useReactQueryConfig } from 'react-query'

// Turn off retries for all queries
useReactQueryConfig({
  retry: false,
})

// Make specific query retry a certain number of times
const { data, isLoading, error } = useQuery(
  ['todos', { page: 1 }],
  fetchTodoList,
  {
    retry: 10, // Will retry failed requests 10 times before displaying an error
  }
)
```

### Retry Delay

By default, retries in React Query do not happen immediately after a request fails. As is standard, a back-off delay is gradually applied to each retry attempt.

The default `retryDelay` is set to double (starting at `1000`ms) with each attempt, but not exceed 30 seconds:

```js
// Configure for all queries
import { useReactQueryConfig } from 'react-query'

const config = {
  retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
}

function App() {
  useReactQueryConfig(config)

  return <Stuff />
}
```

Though it is not recommended, you can obviously override the `retryDelay` function/integer in both the Provider and individual query options. If set to an integer instead of a function the delay will always be the same amount of time:

```js
const { data, isLoading, error } = useQuery('todos', fetchTodoList, {
  retryDelay: 10000, // Will always wait 1000ms to retry, regardless of how many retries
})
```

## Mutations

Unlike queries, mutations are typically used to create/update/delete data or perform server side-effects. For this purpose, React Query exports a `useMutation` hook.

### Basic Mutations

Assuming the server implements a ping mutation, that returns "pong" string, here's an example of the most basic mutation:

```js
const PingPong = () => {
  const [mutate, { data, isLoading, error }] = useMutation(pingMutation)

  const onPing = async () => {
    try {
      const data = await mutate()
      console.log(data)
      // { ping: 'pong' }
    } catch {
      // Uh oh, something went wrong
    }
  }
  return <button onClick={onPing}>Ping</button>
}
```

Mutations without variables are not that useful, so let's add some variables to closer match reality.

### Mutation Variables

To pass `variables` to your `mutate` function, call `mutate` with an object.

```js
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

Even with just variables, mutations aren't all that special, but when used with the `refetchQueries` and `updateQuery` options, they become a very powerful tool.

### Invalidate and Refetch Queries from Mutations

When a mutation succeeds, it's likely that other queries in your application need to update. Where other libraries that use normalized caches would attempt to update locale queries with the new data imperatively, React Query avoids the pitfalls that come with normalized caches and prescribes **atomic updates** instead of partial cache manipulation.

For example, assume we have a mutation to post a new todo:

```js
const [mutate] = useMutation(postTodo)
```

When a successful `postTodo` mutation happens, we likely want all `todos` queries to get refetched to show the new todo item. To do this, you can use the `refetchQueries` option when calling a mutation's `mutate` function.

```js
// When this mutation succeeds, any queries with the `todos` or `reminders` query key will be refetched
mutate(newTodo, { refetchQueries: ['todos', 'reminders'], })

// The 3 queries below will be refetched when the mutation above succeeds
const todoListQuery = useQuery('todos', fetchTodoList)
const todoListQuery = useQuery(['todos', { page: 1 }, fetchTodoList)
const remindersQuery = useQuery('reminders', fetchReminders)
```

You can even refetch queries with specific variables by passing a query key tuple to `refetchQueries`:

```js
mutate(newTodo, { refetchQueries: [['todos', { status: 'done' }]] })

// The query below will be refetched when the mutation above succeeds
const todoListQuery = useQuery(['todos', { status: 'done' }], fetchTodoList)
// However, the following query below will NOT be refetched
const todoListQuery = useQuery('todos', fetchTodoList)
```

If you want to **only** refetch `todos` queries that don't have variables, you can pass a tuple with `variables` set to `false`:

```js
mutate(newTodo, { refetchQueries: [['todos', false]] })

// The query below will be refetched when the mutation above succeeds
const todoListQuery = useQuery(['todos'], fetchTodoList)
// However, the following query below will NOT be refetched
const todoListQuery = useQuery(['todos', { status: 'done' }], fetchTodoList)
```

If you prefer that the promise returned from `mutate()` only resolves **after** any `refetchQueries` have been refetched, you can pass the `waitForRefetchQueries = true` option to `mutate`:

```js
const [mutate] = useMutation(addTodo, {})

const run = async () => {
  try {
    await mutate(todo, { waitForRefetchQueries: true })
    console.log('I will only log after all refetchQueries are done refetching!')
  } catch {}
}
```

### Query Updates from Mutations

When dealing with mutations that **update** objects on the server, it's common for the new object to be automatically returned in the response of the mutation. Instead of invalidating any queries for that item and wasting a network call to refetch them again, we can take advantage of the object returned by the mutation function and update any query responses with that data that match that query using the `updateQuery` option:

```js
const [mutate] = useMutation(editTodo)

mutate(
  {
    id: 5,
    name: 'Do the laundry',
  },
  {
    updateQuery: ['todo', { id: 5 }],
  }
)

// The query below will be updated with the response from the mutation above when it succeeds
const { data, isLoading, error } = useQuery(['todo', { id: 5 }], fetchTodoByID)
```

## Manually or Optimistically Setting Query Data

In rare circumstances, you may want to manually update a query's response before it has been refetched. To do this, you can use the exported `setQueryData` function:

```js
import { setQueryData } from 'react-query'

// Full replacement
setQueryData(['todo', { id: 5 }], newTodo)

// or functional update
setQueryData(['todo', { id: 5 }], previous => ({ ...previous, status: 'done' }))
```

**Most importantly**, when manually setting a query response, it naturally becomes out-of-sync with it's original source. To ease this issue, `setQueryData` automatically triggers a background refresh of the query after it's called to ensure it eventually synchronizes with the original source.

Should you choose that you do _not_ want to refetch the query automatically, you can set the `shouldRefetch` option to `false`:

```js
import { setQueryData } from 'react-query'

// Mutate, but do not automatically refetch the query in the background
setQueryData(['todo', { id: 5 }], newTodo, {
  shouldRefetch: false,
})
```

## Displaying Background Fetching Loading States

A query's `isLoading` boolean is usually sufficient to show the initial hard-loading state for a query, but sometimes you may want to display a more subtle indicator that a query is refetching in the background. To do this, queries also supply you with an `isFetching` boolean that you can use to show that it's in a fetching state:

```js
function Todos() {
  const { data: todos, isLoading, isFetching } = useQuery('todos', fetchTodos)

  return isLoading ? (
    <span>Loading...</span>
  ) : todos ? (
    <>
      {isFetching ? <div>Refreshing...</div> : null}

      <div>
        {todos.map(todo => (
          <Todo todo={todo} />
        ))}
      </div>
    </>
  ) : null
}
```

## Displaying Global Background Fetching Loading State

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

## Window-Focus Refetching

If a user leaves your application and returns to stale data, you may want to trigger an update in the background to update any stale queries. Thankfully, **React Query does this automatically for you**, but if you choose to disable it, you can use the `useReactQueryConfig`'s `refetchAllOnWindowFocus` option to disable it:

```js
useReactQueryConfig({ refetchAllOnWindowFocus: false })
```

# API

## `useQuery`

```js
const {
  data,
  error,
  isFetching,
  isCached,
  failureCount,
  isLoading,
  refetch,
} = useQuery(queryKey, queryFn, {
  manual,
  cacheTime,
  retry,
  retryDelay,
})
```

### Options

- `queryKey: String | [String, Variables: Object] | falsey | Function => queryKey`
  - **Required**
  - The query key to use for this query.
  - If a string is passed, it will be used as the query key
  - If a `[String, Object]` tuple is passed, they will be serialized into a stable query key. See [Query Keys](#query-keys) for more information.
  - If a falsey value is passed, the query will be disabled and not run automatically.
  - If a function is passed, it should resolve to any other valid query key type. If the function throws, the query will be disabled and not run automatically.
  - The query will automatically update when this key changes (if the key is not falsey and if `manual` is not set to `true`)
  - `Variables: Object`
    - If a tuple with variables is passed, this object should be **serializable**.
    - Nested arrays and objects are supported
    - The order of object keys is sorted to be stable before being serialized into the query key
- `queryFn: Function(variables) => Promise(data/error)`
  - **Required**
  - The function that the query will use to request data
  - Optionally receives the `variables` object passed from either the query key tuple (`useQuery(['todos', variables], queryFn)`) or the refetch method's `variables` option `refetch({ variables })`
  - Must return a promise that will either resolves data or throws an error.
- `manual: Boolean`
  - Set this to `true` to disable automatic refetching when the query mounts or changes query keys.
  - To refetch the query, use the `refetch` method returned from the `useQuery` instance.
- `cacheTime`
  - [See `useReactQueryConfig` options...](#usereactqueryconfig)
- `retry`
  - [See `useReactQueryConfig` options...](#usereactqueryconfig)
- `retryDelay`
  - [See `useReactQueryConfig` options...](#usereactqueryconfig)

### Returns

- `data: null | Any`
  - Defaults to `null`
  - The last successfully resolved data for the query.
- `error: null | Error`
  - The error object for the query, if an error was thrown.
- `isLoading: Boolean`
  - Will be `true` if the query is both fetching and does not have any cached data to display.
- `isFetching: Boolean`
  - Will be `true` if the query is currently fetching, including background fetching.
- `isCached: Boolean`
  - Will be `true` if the query's response is currently cached.
- `failureCount: Integer`
  - The failure count for the query.
  - Incremented every time the query fails.
  - Reset to `0` when the query succeeds.
- `refetch: Function({ variables: Object, merge: Function, disableThrow: Boolean })`
  - A function to manually refetch the query.
  - Supports custom variables (useful for "fetch more" calls)
  - Supports custom data merging (useful for "fetch more" calls)
  - Set `disableThrow` to true to disable this function from throwing if an error is encountered.

## `useMutation`

```js
const [mutate, { data, isLoading, error }] = useMutation(mutationFn, {
  refetchQueries,
})

const promise = mutate(variables, { updateQuery })
```

### Options

- `mutationFn: Function(variables) => Promise`
  - **Required**
  - A function that performs an asynchronous task and returns a promise
- `refetchQueries: Array<QueryKey>`
  - When the mutation succeeds, these queries will be automatically refetched
- `variables: any`
  - Optional
  - The variables object to pass tot he `mutationFn`
- `updateQuery: QueryKey`
  - Optional
  - The query key for the individual query to update with the response from this mutation.
  - Suggested use is for `update` mutations that regularly return the updated data with the mutation. This saves you from making another unnecessary network call to refetch the data.

### Returns

- `mutate: Function(variables, { updateQuery })`
  - The mutation function you can call with variables to trigger the mutation and optionally update a query with its response.
- `data: null | Any`
  - Defaults to `null`
  - The last successfully resolved data for the query.
- `error: null | Error`
  - The error object for the query, if an error was thrown.
- `isLoading: Boolean`
  - Will be `true` if the query is both fetching and does not have any cached data
- `promise: Promise`
  - The promise that is returned by the `mutationFn`

## `setQueryData`

`setQueryData` is a function for imperatively updating the response of a query. By default, this function also triggers a background refetch to ensure that the data is eventually consistent with the remote source, but this can be disabled.

```js
import { setQueryData } from 'react-query'

const maybePromise = setQueryData(queryKey, data, { shouldRefetch })
```

### Options

- `queryKey: QueryKey`
  - **Required**
  - The query key for the individual query to update with new data.
- `data: any | Function(old) => any`
  - **Required**
  - Must either be the new data or a function that receives the old data and returns the new data
- `shouldRefetch: Boolean`
  - Optional
  - Defaults to `true`
  - Set this to `false` to disable the automatic background refetch from happening

### Returns

- `maybePromise: undefined | Promise`
  - If `shouldRefetch` is `true`, a promise is returned that will either resolve when the query refetch is complete or will reject if the refetch fails (after its respective retry configurations is done).

## `refetchQuery`

`refetchQuery` is a function for imperatively triggering a refetch of either:

- A group of queries
- A single query

By default, it will only refetch stale queries, but the `force` option can be used to refetch all queries, including non-stale ones.

```js
import { refetchQuery } from 'react-query'

const promise = refetchQuery(queryKey, { force })
```

### Options

- `queryKey: QueryKey`
  - **Required**
  - The query key for the query or query group to refetch.
  - If a single `string` is passed, any queries using that `string` or any tuple key queries that include that `string` (eg. passing `todos` would refetch both `todos` and `['todos', { status: 'done' }]`).
  - If a tuple key is passed, only the exact query with that key will be refetched (eg. `['todos', { status: 'done' }]` will only refetch queries with that exact key)
  - If a tuple key is passed with the `variables` slot set to `false`, then only queries that match the `string` key and have no variables will be refetched (eg. `['todos', false]` would only refetch `todos` and not `['todos', { status: 'done' }]`)
- `force: Boolean`
  - Optional
  - Set this to true to force all queries to refetch instead of only stale ones.

### Returns

- `promise: Promise`
  - A promise is returned that will either resolve when all refetch queries are complete or will reject if any refetch queries fail (after their respective retry configurations are done).

## `refetchAllQueries`

`refetchAllQueries` is a function for imperatively triggering a refetch of all queries. By default, it will only refetch stale queries, but the `force` option can be used to refetch all queries, including non-stale ones.

```js
import { refetchAllQueries } from 'react-query'

const promise = refetchAllQueries({ force })
```

### Options

- `force: Boolean`
  - Optional
  - Set this to true to force all queries to refetch instead of only stale ones.

### Returns

- `promise: Promise`
  - A promise is returned that will either resolve when all refetch queries are complete or will reject if any refetch queries fail (after their respective retry configurations are done).

## `useIsFetching`

`useIsFetching` is an optional hook that returns true if any query in your application is loading for fetching in the background (useful for app-wide loading indicators)

```js
import { useIsFetching } from 'react-query'

const isFetching = useIsFetching()
```

### Returns

- `isFetching: Boolean`
  - Will be `true` if any query in your application is loading or fetching in the background

## `useReactQueryConfig`

`useReactQueryConfig` is optional and can be used to define defaults for all instances of `useQuery` through your app:

```js
import { useReactQueryConfig } from 'react-query'

useReactQueryConfig({
  retry,
  retryDelay,
  cacheTime,
  invalidCacheTime,
})
```

### Options

Pass options to `useReactQueryConfig` by pass it a `config` prop:

- `retry: Boolean | Int`
  - If `false`, failed queries will not retry by default
  - If `true`, failed queries will retry infinitely
  - If set to an `Int`, eg. `3`, failed queries will retry until the failed query count meets that number
- `retryDelay: Function(retryAttempt: Int) => Int`
  - This function receives a `retryAttempt` integer and returns the delay to apply before the next attempt in milliseconds
  - A function like `attempt => Math.min(attempt > 1 ? 2 ** attempt * 1000 : 1000, 30 * 1000)` applies exponential backoff
  - A function like `attempt => attempt * 1000` applies linear backoff.
- `cacheTime: Int`
  - The time in milliseconds that cache data remains fresh. After a successful cache update, that cache data will become stale after this duration
- `invalidCacheTime: Int`
  - The time in milliseconds that unused/inactive cache data remains in memory. When a query's cache becomes unused or inactive, that cache data will be garbage collected after this duration.

### Returns

This hook does not return anything

### Example

```js
const config = {
  // These are the default config options for the useReactQueryConfig
  retry: 3,
  retryDelay: attempt =>
    Math.min(attempt > 1 ? 2 ** attempt * 1000 : 1000, 30 * 1000),
  cacheTime: 10 * 1000, // 10 seconds
  invalidCacheTime: 10 * 1000, // 10 seconds
}

function App() {
  useReactQueryConfig({
    retry: 4
  })

  return </>
}
```
