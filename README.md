![React Query Header](https://github.com/tannerlinsley/react-query/raw/master/media/header.png)

<img src='https://github.com/tannerlinsley/react-query/raw/master/media/logo.png' width='300'/>

Hooks for fetching, caching and updating asynchronous data in React

<!-- <a href="https://travis-ci.org/tannerlinsley/react-query" target="\_parent">
  <img alt="" src="https://travis-ci.org/tannerlinsley/react-query.svg?branch=master" />
</a> -->
<a href="https://twitter.com/intent/tweet?button_hashtag=TanStack" target="\_parent">
  <img alt="#TanStack" src="https://img.shields.io/twitter/url?color=%2308a0e9&label=%23TanStack&style=social&url=https%3A%2F%2Ftwitter.com%2Fintent%2Ftweet%3Fbutton_hashtag%3DTanStack">
</a>
<a href="https://npmjs.com/package/react-query" target="\_parent">
  <img alt="" src="https://img.shields.io/npm/dm/react-query.svg" />
</a>
<a href="https://bundlephobia.com/result?p=react-query@latest" target="\_parent">
  <img alt="" src="https://badgen.net/bundlephobia/minzip/react-query@latest" />
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

Enjoy this library? Try them all! [React Table](https://github.com/tannerlinsley/react-table), [React Form](https://github.com/tannerlinsley/react-form), [React Charts](https://github.com/tannerlinsley/react-charts)

## Quick Features

- Transport, protocol & backend agnostic data fetching
- Auto Caching + Refetching (stale-while-revalidate, Window Refocus, Polling/Realtime)
- Parallel + Dependent Queries
- Mutations + Automatic Query Refetching
- Multi-layer Cache + Garbage Collection
- Load-More Pagination + Scroll Recovery
- Request Cancellation
- [React Suspense](https://reactjs.org/docs/concurrent-mode-suspense.html) Support
- <a href="https://bundlephobia.com/result?p=react-query@latest" target="\_parent">
    <img alt="" src="https://badgen.net/bundlephobia/minzip/react-query@latest" />
  </a>

<details>
<summary>Core Issues and Solution</summary>

## The Challenge

Tools for managing async data and client stores/caches are plentiful these days, but most of these tools:

- Duplicate unnecessary network operations
- Force normalized or object/id-based caching strategies on your data
- Do not automatically manage stale-ness or caching
- Do not offer robust API's around mutation events, invalidation or query management
- Are built for highly-opinionated systems like Redux, GraphQL, [insert proprietary tools] etc.

## The Solution

React Query exports a set of hooks that attempt to address these issues. Out of the box, React Query:

- Flexibly dedupes simultaneous requests to assets
- Automatically caches data
- Automatically invalidates stale cache data
- Optimistically updates stale requests in the background
- Automatically manages garbage collection
- Supports automatic retries and exponential or custom back-off delays
- Provides both declarative and imperative API's for:
  - Mutations and automatic query syncing
  - Query Refetching
  - Atomic and Optimistic query manipulation

</details>

<details>
<summary>Inspiration & Hat-Tipping</summary>
<br />
A big thanks to both [Draqula](https://github.com/vadimdemedes/draqula) for inspiring a lot of React Query's original API and documentation and also [Zeit's SWR](https://github.com/zeit/swr) and its creators for inspiring even further customizations and examples. You all rock!

</details>

## Examples

- [Basic](./examples/basic)
- [Custom Hooks](./examples/custom-hooks)
- [Auto Refetching / Polling / Realtime](./examples/auto-refetching)
- [Window Refocus Refetching](./examples/focus-refetching)
- [Optimistic Updates](./examples/optimistic-updates)
- [Load-More Pagination](./examples/load-more-pagination)
- [Suspense CodeSandbox](https://codesandbox.io/s/github/tannerlinsley/react-query/tree/master/examples/suspense)
- [Playground CodeSandbox](https://codesandbox.io/s/github/tannerlinsley/react-query/tree/master/examples/sandbox)

## Sponsors

This library is being built and maintained by me, @tannerlinsley and I am always in need of more support to keep projects like this afloat. If you would like to get premium support, add your logo or name on this README, or simply just contribute to my open source Sponsorship goal, [visit my Github Sponsors page!](https://github.com/sponsors/tannerlinsley/)

<table>
  <tbody>
    <tr>
      <td align="center" valign="middle">
        <a href="https://github.com/sponsors/tannerlinsley" target="_blank">
          <img width='150' src="https://raw.githubusercontent.com/tannerlinsley/files/master/images/patreon/diamond.png">
        </a>
      </td>
      <td align="center" valign="middle">
        <a href="https://github.com/sponsors/tannerlinsley" target="_blank">
          Become a Sponsor!
        </a>
      </td>
    </tr>
  </tbody>
</table>

<table>
  <tbody>
    <tr>
      <td align="center" valign="middle">
        <a href="https://github.com/sponsors/tannerlinsley/" target="_blank">
          <img width='150' src="https://raw.githubusercontent.com/tannerlinsley/files/master/images/patreon/platinum.png">
        </a>
      </td>
      <td align="center" valign="middle">
       <a href="https://github.com/sponsors/tannerlinsley" target="_blank">
          Become a Sponsor!
        </a>
      </td>
    </tr>
  </tbody>
</table>

<table>
  <tbody>
    <tr>
      <td align="center" valign="middle">
        <a href="https://github.com/sponsors/tannerlinsley/" target="_blank">
          <img width='150' src="https://raw.githubusercontent.com/tannerlinsley/files/master/images/patreon/gold.png">
        </a>
      </td>
      <td align="center" valign="middle">
        <a href="https://github.com/sponsors/tannerlinsley" target="_blank">
          Become a Sponsor!
        </a>
      </td>
    </tr>
  </tbody>
</table>

<table>
  <tbody>
    <tr>
      <td align="center" valign="middle">
        <a href="https://github.com/sponsors/tannerlinsley/" target="_blank">
          <img width='150' src="https://raw.githubusercontent.com/tannerlinsley/files/master/images/patreon/silver.png">
        </a>
      </td>
      <td align="center" valign="middle">
        <a href="https://github.com/sponsors/tannerlinsley" target="_blank">
          Become a Sponsor!
        </a>
      </td>
    </tr>
  </tbody>
</table>

<table>
  <tbody>
    <tr>
      <td valign="top">
        <a href="https://github.com/sponsors/tannerlinsley/">
          <img width='150' src="https://raw.githubusercontent.com/tannerlinsley/files/master/images/patreon/supporters.png" />
        </a>
      </td>
      <td>
        <ul>
          <li><a href="https://github.com/bgazzera">@bgazzera<a></li>
        </ul>
      </td>
      <td>
        <a href="https://github.com/sponsors/tannerlinsley" target="_blank">
          Become a Supporter!
        </a>
      </td>
    </tr>
  </tbody>
</table>

<table>
  <tbody>
    <tr>
      <td valign="top">
        <a href="https://github.com/sponsors/tannerlinsley/">
          <img width='150' src="https://raw.githubusercontent.com/tannerlinsley/files/master/images/patreon/fans.png" />
        </a>
      </td>
      <!-- <td>
        <ul>
        <li></li>
        </ul>
      </td> -->
      <td>
        <a href="https://github.com/sponsors/tannerlinsley" target="_blank">
          Become a Fan!
        </a>
      </td>
    </tr>
  </tbody>
</table>

# Documentation

- [Installation](#installation)
- [Queries](#queries)
  - [Query Keys](#query-keys)
  - [Query Variables](#query-variables)
  - [Dependent Queries](#dependent-queries)
  - [Caching & Invalidation](#caching--invalidation)
  - [Load-More & Infinite-Scroll Pagination](#load-more--infinite-scroll-pagination)
  - [Scroll Restoration](#scroll-restoration)
  - [Manual Querying](#manual-querying)
  - [Retries](#retries)
  - [Retry Delay](#retry-delay)
  - [Prefetching](#prefetching)
  - [Suspense Mode](#suspense-mode)
  - [Fetch-on-render vs Fetch-as-you-render](#fetch-on-render-vs-fetch-as-you-render)
  - [Cancelling Query Requests](#cancelling-query-requests)
- [Mutations](#mutations)
  - [Basic Mutations](#basic-mutations)
  - [Mutation Variables](#mutation-variables)
  - [Invalidate and Refetch Queries from Mutations](#invalidate-and-refetch-queries-from-mutations)
  - [Query Updates from Mutations](#query-updates-from-mutations)
- [Manually or Optimistically Setting Query Data](#manually-or-optimistically-setting-query-data)
- [Displaying Background Fetching Loading States](#displaying-background-fetching-loading-states)
- [Displaying Global Background Fetching Loading State](#displaying-global-background-fetching-loading-state)
- [Window-Focus Refetching](#window-focus-refetching)
- [Custom Query Key Serializers (Experimental)](#custom-query-key-serializers-experimental)
- [API](#api)
  - [`useQuery`](#usequery)
  - [`useMutation`](#usemutation)
  - [`setQueryData`](#setquerydata)
  - [`refetchQuery`](#refetchquery)
  - [`prefetchQuery`](#prefetchQuery)
  - [`refetchAllQueries`](#refetchallqueries)
  - [`useIsFetching`](#useisfetching)
  - [`clearQueryCache`](#clearquerycache)
  - [`ReactQueryConfigProvider`](#reactqueryconfigprovider)

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

React Query makes it easy to make queries that depend on other queries for both:

- Parallel Queries (avoiding waterfalls) and
- Serial Queries (when a piece of data is required for the next query to happen).

To do this, you can use the following 2 approaches:

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
const { data: user } = useQuery(ready && ['user', { userId }]) // Wait for ready to be truthy
const { data: projects } = useQuery(
  () => ['projects', { userId: user.id }] // Wait for user.id to become available (and not throw)
```

### Caching & Invalidation

React Query caching is automatic out of the box. It uses a `stale-while-revalidate` in-memory caching strategy together with robust query deduping to always ensure a query's data is only cached when it's needed and only cached once even if that query is used multiple times across your application.

At a glance:

- The cache is keyed on unique `query + variables` combinations.
- By default query results become **stale** immediately after a successful fetch. This can be configured using the `staleTime` option at both the global and query-level.
- Stale queries are automatically refetched whenever their **query keys change (this includes variables used in query key tuples)** or when **new usages/instances** of a query are mounted.
- By default query results are **always** cached **when in use**.
- If and when a query is no longer being used, it becomes **inactive** and by default is cached in the background for **5 minutes**. This time can be configured using the `cacheTime` option at both the global and query-level.
- After a query is inactive for the `cacheTime` specified (defaults to 5 minutes), the query is deleted and garbage collected.

<details>
 <summary>A more detailed example of the caching lifecycle</summary>

Let's assume we are using the default `cacheTime` of **5 minutes** and the default `staleTime` of `0`.

- A new instance of `useQuery('todos', fetchTodos)` mounts.
  - Since no other queries have been made with this query + variable combination, this query will show a hard loading state and make a network request to fetch the data.
  - It will then cache the data using `'todos'` and `` as the unique identifiers for that cache.
  - A stale invalidation is scheduled using the `staleTime` option as a delay (defaults to `0`, or immediately).
- A second instance of `useQuery('todos', fetchTodos)` mounts elsewhere.
  - Because this exact data exist in the cache from the first instance of this query, that data is immediately returned from the cache.
  - Since the query is stale, it is refetched in the background automatically.
- Both instances of the `useQuery('todos', fetchTodos)` query are unmount and no longer in use.
  - Since there are no more active instances to this query, a cache timeout is set using `cacheTime` to delete and garbage collect the query (defaults to **5 minutes**).
- No more instances of `useQuery('todos', fetchTodos)` appear within **5 minutes**.
  - This query and its data is deleted and garbage collected.

</details>

### Load-More & Infinite-Scroll Pagination

Rendering paginated lists that can "load more" data or "infinite scroll" is a common UI pattern. React Query supports some useful features for querying these types of lists. Let's assume we have an API that returns pages of `todos` 3 at a time based on a `cursor` index:

```js
fetch('/api/projects?cursor=0')
// { data: [...], nextId: 3}
fetch('/api/projects?cursor=3')
// { data: [...], nextId: 6}
fetch('/api/projects?cursor=6')
// { data: [...], nextId: 9}
```

Using the `nextId` value in each page's response, we can configure `useQuery` to fetch more pages as needed:

- Configure your query function to use optional pagination variables. We'll send through the `nextId` as the `cursor` for the next page request.
- Set the `paginated` option to `true`.
- Define a `getCanFetchMore` option to know if there is more data to load (it receives the `lastPage` and `allPages` as parameters).

```js
import { useQuery } from 'react-query'

function Todos() {
  const {
    data: pages,
    isLoading,
    isFetching,
    isFetchingMore,
    fetchMore,
    canFetchMore,
  } = useQuery(
    'todos',
    ({ nextId } = {}) => fetch('/api/projects?cursor=' + (nextId || 0)),
    {
      paginated: true,
      getCanFetchMore: (lastPage, allPages) => lastPage.nextId,
    }
  )

  // ...
}
```

You'll notice a few new things now:

- `data` is now an array of pages that contain query results, instead of the query results themselves
- A `fetchMore` function is now available
- A `canFetchMore` boolean is now available
- An `isFetchingMore` boolean is now available

These can now be used to render a "load more" list (this example uses an `offset` key):

```js
import { useQuery } from 'react-query'

function Todos() {
  const {
    data: pages,
    isLoading,
    isFetching,
    isFetchingMore,
    fetchMore,
    canFetchMore,
  } = useQuery(
    'projects',
    ({ offset } = {}) => fetch('/api/projects?offset=' + (offset || 0)),
    {
      paginated: true,
      getCanFetchMore: (lastPage, allPages) => lastPage.nextId,
    }
  )

  const loadMore = async () => {
    try {
      // Get the last page
      const lastPage = pages[pages.length - 1]
      // Get the last item's ID
      const lastItemId = lastPage[lastPage.length - 1].id
      // Fetch more with the offset ID + 1
      await fetchMore({
        offset: lastItemId + 1,
      })
    } catch {}
  }

  return isLoading ? (
    <p>Loading...</p>
  ) : data ? (
    <>
      {data.map((page, i) => (
        <React.Fragment key={i}>
          {page.data.map(project => (
            <p key={project.id}>{project.name}</p>
          ))}
        </React.Fragment>
      ))}
      <div>
        {canFetchMore ? (
          <button onClick={loadMore} disabled={isFetchingMore}>
            {isFetchingMore ? 'Loading more...' : 'Load More'}
          </button>
        ) : (
          'Nothing more to fetch.'
        )}
      </div>
      <div>
        {isFetching && !isFetchingMore ? 'Background Updating...' : null}
      </div>
    </>
  ) : null
}
```

#### What happens when a paginated query needs to be refetched?\*\*

When a paginated query becomes `stale` and needs to be refetched, each page is fetched `individually` with the same variables that were used to request it originally. If a paginated query's results are ever removed from the cache, the pagination restarts at the initial state with a single page being requested.

### Scroll Restoration

Out of the box, "scroll restoration" Just Works™️ in React Query. The reason for this is that query results are cached and retrieved synchronously when rendered. As long as a query is cached and has not been garbage collected, you should never experience problems with scroll restoration.

### Manual Querying

If you ever want to disable a query from automatically running, you can use the `manual = true` option. When `manual` is set to true:

- The query will not automatically refetch due to changes to their query function or variables.
- The query will not automatically refetch due to `refetchQueries` options in other queries or via `refetchQuery` calls.

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

- Setting `retry = false` will disable retries.
- Setting `retry = 6` will retry failing requests 6 times before showing the final error thrown by the function.
- Setting `retry = true` will infinitely retry failing requests.

```js
import { useQuery } from 'react-query'

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
import { ReactQueryConfigProvider } from 'react-query'

const queryConfig = {
  retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
}

function App() {
  return (
    <ReactQueryConfigProvider config={queryConfig}>
      ...
    </ReactQueryConfigProvider>
  )
}
```

Though it is not recommended, you can obviously override the `retryDelay` function/integer in both the Provider and individual query options. If set to an integer instead of a function the delay will always be the same amount of time:

```js
const { data, isLoading, error } = useQuery('todos', fetchTodoList, {
  retryDelay: 10000, // Will always wait 1000ms to retry, regardless of how many retries
})
```

### Prefetching

If you're lucky enough, you may know enough about what your users will do to be able to prefetch the data they need before it's needed! If this is the case, then you're in luck. You can use the `prefetchQuery` function to prefetch the results of a query to be placed into the cache:

```js
import { prefetchQuery } from 'react-query'

const prefetchTodos = async () => {
  const queryData = await prefetchQuery('todos', () => fetch('/todos'))
  // The results of this query will be cached like a normal query
}
```

The next time a `useQuery` instance is used for a prefetched query, it will use the cached data! If no instances of `useQuery` appear for a prefetched query, it will be deleted and garbage collected after the time specified in `cacheTime`.

### Suspense Mode

React Query can also be used with React's new Suspense for Data Fetching API's. To enable this mode, you can set either the global or query level config's `suspense` option to `true`.

Global configuration:

```js
// Configure for all queries
import { ReactQueryConfigProvider } from 'react-query'

const queryConfig = {
  suspense: true,
}

function App() {
  return (
    <ReactQueryConfigProvider config={queryConfig}>
      ...
    </ReactQueryConfigProvider>
  )
}
```

Query configuration:

```js
const { useQuery } from 'react-query'

// Enable for an individual query
useQuery(queryKey, queryFn, { suspense: true })
```

When using suspense mode, `isLoading` and `error` states will be replaced by usage of the `React.Suspense` component (including the use of the `fallback` prop and React error boundaries for catching errors). Please see the [Suspense Example](https://codesandbox.io/s/github/tannerlinsley/react-query/tree/master/examples/sandbox) for more information on how to set up suspense mode.

### Fetch-on-render vs Fetch-as-you-render

Out of the box, React Query in `suspense` mode works really well as a **Fetch-on-render** solution with no additional configuration. However, if you want to take it to the next level and implement a `Fetch-as-you-render` model, we recommend implementing [Prefetching](#prefetching) on routing and/or user interactions events to initialize queries before they are needed.

### Cancelling Query Requests

By default, queries that become inactive before their promises are resolved are simply ignored instead of cancelled. Why is this?

- For most applications, ignoring out-of-date queries is sufficient.
- Cancellation APIs may not be available for every query function.
- If cancellation APIs are available, they typically vary in implementation between utilities/libraries (eg. Fetch vs Axios vs XMLHttpRequest).

But don't worry! If your queries are high-bandwidth or potentially very expensive to download, React Query exposes a generic way to **cancel** query requests using a cancellation token or other related API. To integrate with this feature, attach a `cancel` function to the promise returned by your query that implements your request cancellation. When a query becomes out-of-date or inactive, this `promise.cancel` function will called (if available):

Using `axios`:

```js
import { CancelToken } from 'axios'

const query = useQuery('todos', () => {
  // Create a new CancelToken source for this request
  const source = CancelToken.source()

  const promise = axios.get('/todos', {
    // Pass the source token to your request
    cancelToken: source.token,
  })

  // Cancel the request if React Query calls the `promise.cancel` method
  promise.cancel = () => {
    source.cancel('Query was cancelled by React Query')
  }

  return promise
})
```

Using `fetch`:

```js
const query = useQuery('todos', () => {
  // Create a new AbortController instance for this request
  const controller = new AbortController()
  // Get the abortController's signal
  const signal = controller.signal

  const promise = fetch('/todos', {
    method: 'get',
    // Pass the signal to your request
    signal,
  })

  // Cancel the request if React Query calls the `promise.cancel` method
  promise.cancel = controller.abort

  return promise
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
const [mutate] = useMutation(addTodo, { refetchQueries: ['todos'] })

const run = async () => {
  try {
    await mutate(todo, { waitForRefetchQueries: true })
    console.log('I will only log after all refetchQueries are done refetching!')
  } catch {}
}
```

It's important to note that `refetchQueries` by default will only happen after a successful mutation (the mutation function doesn't throw an error). If you would like to refetch the `refetchQueries` regardless of this, you can set `refetchQueriesOnFailure` to `true` in your `mutate` options:

```js
const [mutate] = useMutation(addTodo, { refetchQueries: ['todos'] })

const run = async () => {
  try {
    await mutate(todo, { refetchQueriesOnFailure: true })
    // Even if the above mutation fails, any `todos` queries will still be refetched.
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

If a user leaves your application and returns to stale data, you may want to trigger an update in the background to update any stale queries. Thankfully, **React Query does this automatically for you**, but if you choose to disable it, you can use the `ReactQueryConfigProvider`'s `refetchAllOnWindowFocus` option to disable it:

```js
const queryConfig = { refetchAllOnWindowFocus: false }

function App() {
  return (
    <ReactQueryConfigProvider config={queryConfig}>
      ...
    </ReactQueryConfigProvider>
  )
}
```

## Custom Query Key Serializers (Experimental)

> **WARNING:** This is an advanced and experimental feature. There be dragons here. Do not change the Query Key Serializer unless you know what you are doing and are fine with encountering edge cases in the React Query API

If you absolutely despise the default query key and variable syntax, you can replace the default query key serializer with your own by using the `ReactQueryConfigProvider` hook's `queryKeySerializerFn` option:

```js
const queryConfig = {
  queryKeySerializerFn: userQueryKey => {
    // Your custom logic here...

    return [fullQueryHash, queryGroupId, variablesHash, variables]
  },
}

function App() {
  return (
    <ReactQueryConfigProvider config={queryConfig}>
      ...
    </ReactQueryConfigProvider>
  )
}
```

- `userQueryKey: any`
  - This is the queryKey passed in `useQuery` and all other public methods and utilities exported by React Query.
- `fullQueryHash: string`
  - This must be a unique `string` representing the query and variables.
  - It must be stable and deterministic and should not change if things like the order of variables is changed or shuffled.
- `queryGroupId: string`
  - This must be a unique `string` representing only the query type without any variables.
  - It must be stable and deterministic and should not change if the variables of the query change.
- `variablesHash: string`
  - This must be a unique `string` representing only the variables of the query.
  - It must be stable and deterministic and should not change if things like the order of variables is changed or shuffled.
- `variables: any`
  - This is the object that will be passed to the `queryFn` when using `useQuery`.

> An additional `stableStringify` utility is also exported to help with stringifying objects to have sorted keys.

#### URL Query Key Serializer Example

The example below shows how to build your own serializer for use with urls and use it with React Query:

```js
import { ReactQueryConfigProvider, stableStringify } from 'react-query'

function urlQueryKeySerializer(queryKey) {
  // Deconstruct the url
  let [url, params = ''] = queryKey.split('?')

  // Build the variables object
  let variables = {}
  params
    .split('&')
    .filter(Boolean)
    .forEach(param => {
      const [key, value] = param.split('=')
      variables[key] = value
    })

  // Use stableStringify to turn variables into a stable string
  const variablesHash = Object.keys(variables).length
    ? stableStringify(variables)
    : ''

  // Remove trailing slashes from the url to make an ID
  const queryGroupId = url.replace(/\/{1,}$/, '')

  const queryHash = `${id}_${variablesHash}`

  return [queryHash, queryGroupId, variablesHash, variables]
}

const queryConfig = {
  queryKeySerializerFn: urlQueryKeySerializer,
}

function App() {
  return (
    <ReactQueryConfigProvider config={queryConfig}>
      ...
    </ReactQueryConfigProvider>
  )
}

// Heck, you can even make your own custom useQueryHook!

function useUrlQuery(url, options) {
  return useQuery(url, () => axios.get(url).then(res => res.data))
}

// Use it in your app!

function Todos() {
  const todosQuery = useUrlQuery(`/todos`)
}

function FilteredTodos({ status = 'pending' }) {
  const todosQuery = useFunctionQuery([getTodos, { status }])
}

function Todo({ id }) {
  const todoQuery = useUrlQuery(`/todos/${id}`)
}

refetchQuery('/todos')
refetchQuery('/todos?status=pending')
refetchQuery('/todos/5')
```

#### Function Query Key Serializer Example

The example below shows how to you build your own functional serializer and use it with React Query:

```js
import { ReactQueryConfigProvider, stableStringify } from 'react-query'

// A map to keep track of our function pointers
const functionSerializerMap = new Map()

function functionQueryKeySerializer(queryKey) {
  if (!queryKey) {
    return []
  }

  let queryFn = queryKey
  let variables

  if (Array.isArray(queryKey)) {
    queryFn = queryKey[0]
    variables = queryKey[1]
  }

  // Get or create an ID for the function pointer
  const queryGroupId =
    functionSerializerMap.get(queryFn) ||
    (() => {
      const id = Date.now()
      functionSerializerMap.set(queryFn, id)
      return id
    })()

  const variablesIsObject = isObject(variables)

  const variablesHash = variablesIsObject ? stableStringify(variables) : ''

  const queryHash = `${queryGroupId}_${variablesHash}`

  return [queryHash, queryGroupId, variablesHash, variables]
}

const queryConfig = {
  queryKeySerializerFn: functionQueryKeySerializer,
}

function App() {
  return (
    <ReactQueryConfigProvider config={queryConfig}>
      ...
    </ReactQueryConfigProvider>
  )
}
// Heck, you can even make your own custom useQueryHook!

function useFunctionQuery(functionTuple, options) {
  const [queryFn, variables] = Array.isArray(functionTuple)
    ? functionTuple
    : [functionTuple]
  return useQuery(functionTuple, queryFn, options)
}

// Use it in your app!

function Todos() {
  const todosQuery = useFunctionQuery(getTodos)
}

function FilteredTodos({ status = 'pending' }) {
  const todosQuery = useFunctionQuery([getTodos, { status }])
}

function Todo({ id }) {
  const todoQuery = useFunctionQuery([getTodo, { id }])
}

refetchQuery(getTodos)
refetchQuery([getTodos, { status: 'pending' }])
refetchQuery([getTodo, { id: 5 }])
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
  // with paginated mode enabled
  isFetchingMore,
  canFetchMore,
  fetchMore,
} = useQuery(queryKey, queryFn, {
  manual,
  paginated,
  getCanFetchMore,
  staleTime,
  cacheTime,
  refetchInterval,
  retry,
  retryDelay,
  onSuccess,
  onError,
  suspense,
})
```

### Options

- `queryKey: String | [String, Variables: Object] | falsey | Function => queryKey`
  - **Required**
  - The query key to use for this query.
  - If a string is passed, it will be used as the query key.
  - If a `[String, Object]` tuple is passed, they will be serialized into a stable query key. See [Query Keys](#query-keys) for more information.
  - If a falsey value is passed, the query will be disabled and not run automatically.
  - If a function is passed, it should resolve to any other valid query key type. If the function throws, the query will be disabled and not run automatically.
  - The query will automatically update when this key changes (if the key is not falsey and if `manual` is not set to `true`).
  - `Variables: Object`
    - If a tuple with variables is passed, this object should be **serializable**.
    - Nested arrays and objects are supported.
    - The order of object keys is sorted to be stable before being serialized into the query key.
- `queryFn: Function(variables) => Promise(data/error)`
  - **Required**
  - The function that the query will use to request data.
  - Optionally receives the `variables` object passed from either the query key tuple (`useQuery(['todos', variables], queryFn)`) or the `refetch` method's `variables` option, e.g. `refetch({ variables })`.
  - Must return a promise that will either resolves data or throws an error.
- `paginated: Boolean`
  - Set this to `true` to enable `paginated` mode.
  - In this mode, new pagination utilities are returned from `useQuery` and `data` becomes an array of page results.
- `manual: Boolean`
  - Set this to `true` to disable automatic refetching when the query mounts or changes query keys.
  - To refetch the query, use the `refetch` method returned from the `useQuery` instance.
- `getCanFetchMore: Function(lastPage, allPages) => Boolean`
  - **Required if using `paginated` mode**
  - When using `paginated` mode, this function should return `true` if there is more data that can be fetched.
- `retry: Boolean | Int`
  - If `false`, failed queries will not retry by default.
  - If `true`, failed queries will retry infinitely.
  - If set to an `Int`, e.g. `3`, failed queries will retry until the failed query count meets that number.
- `retryDelay: Function(retryAttempt: Int) => Int`
  - This function receives a `retryAttempt` integer and returns the delay to apply before the next attempt in milliseconds.
  - A function like `attempt => Math.min(attempt > 1 ? 2 ** attempt * 1000 : 1000, 30 * 1000)` applies exponential backoff.
  - A function like `attempt => attempt * 1000` applies linear backoff.
- `staleTime: Int`
  - The time in milliseconds that cache data remains fresh. After a successful cache update, that cache data will become stale after this duration.
- `cacheTime: Int`
  - The time in milliseconds that unused/inactive cache data remains in memory. When a query's cache becomes unused or inactive, that cache data will be garbage collected after this duration.
- `refetchInterval: false | Integer`
  - Optional
  - If set to a number, all queries will continuously refetch at this frequency in milliseconds.
- `onError: Function(err) => void`
  - Optional
  - This function will fire if the query encounters an error (after all retries have happened) and will be passed the error.
- `onSuccess: Function(data) => data`
  - Optional
  - This function will fire any time the query successfully fetches new data.
- `suspense: Boolean`
  - Optional
  - Set this to `true` to enable suspense mode.
  - When `true`, `useQuery` will suspend when `isLoading` would normally be `true`.
  - When `true`, `useQuery` will throw runtime errors when `error` would normally be truthy.

### Returns

- `data: null | Any`
  - Defaults to `null`.
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
  - Supports custom variables (useful for "fetch more" calls).
  - Supports custom data merging (useful for "fetch more" calls).
  - Set `disableThrow` to true to disable this function from throwing if an error is encountered.
- `isFetchingMore: Boolean`
  - If using `paginated` mode, this will be `true` when fetching more results using the `fetchMore` function.
- `canFetchMore: Boolean`
  - If using `paginated` mode, this will be `true` if there is more data to be fetched (known via the required `getCanFetchMore` option function).
- `fetchMore: Function(variables) => Promise`
  - If using `paginated` mode, this function allows you to fetch the next "page" of results.
  - `variables` should be an object that is passed to your query function to retrieve the next page of results.

## `useMutation`

```js
const [mutate, { data, isLoading, error }] = useMutation(mutationFn, {
  refetchQueries,
  refetchQueriesOnFailure,
})

const promise = mutate(variables, { updateQuery, waitForRefetchQueries })
```

### Options

- `mutationFn: Function(variables) => Promise`
  - **Required**
  - A function that performs an asynchronous task and returns a promise.
- `refetchQueries: Array<QueryKey>`
  - Optional
  - When the mutation succeeds, these queries will be automatically refetched.
  - Must be an array of query keys, e.g. `['todos', ['todo', { id: 5 }], 'reminders']`.
- `refetchQueriesOnFailure: Boolean`
  - Defaults to `false`
  - Set this to `true` if you want `refetchQueries` to be refetched regardless of the mutation succeeding.
- `variables: any`
  - Optional
  - The variables object to pass to the `mutationFn`.
- `updateQuery: QueryKey`
  - Optional
  - The query key for the individual query to update with the response from this mutation.
  - Suggested use is for `update` mutations that regularly return the updated data with the mutation. This saves you from making another unnecessary network call to refetch the data.
- `waitForRefetchQueries: Boolean`
  - Optional
  - If set to `true`, the promise returned by `mutate()` will not resolve until refetched queries are resolved as well.

### Returns

- `mutate: Function(variables, { updateQuery })`
  - The mutation function you can call with variables to trigger the mutation and optionally update a query with its response.
- `data: null | Any`
  - Defaults to `null`
  - The last successfully resolved data for the query.
- `error: null | Error`
  - The error object for the query, if an error was thrown.
- `isLoading: Boolean`
  - Will be `true` if the query is both fetching and does not have any cached data.
- `promise: Promise`
  - The promise that is returned by the `mutationFn`.

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
  - Must either be the new data or a function that receives the old data and returns the new data.
- `shouldRefetch: Boolean`
  - Optional
  - Defaults to `true`
  - Set this to `false` to disable the automatic background refetch from happening.

### Returns

- `maybePromise: undefined | Promise`
  - If `shouldRefetch` is `true`, a promise is returned that will either resolve when the query refetch is complete or will reject if the refetch fails (after its respective retry configurations is done).

## `refetchQuery`

`refetchQuery` is a function that can be used to trigger a refetch of:

- A group of active queries.
- A single, specific query.

By default, `refetchQuery` will only refetch stale queries, but the `force` option can be used to include non-stale ones.

```js
import { refetchQuery } from 'react-query'

const promise = refetchQuery(queryKey, { force })
```

### Options

- `queryKey: QueryKey`
  - **Required**
  - The query key for the query or query group to refetch.
  - If a single `string` is passed, any queries using that `string` or any tuple key queries that include that `string` (e.g. passing `todos` would refetch both `todos` and `['todos', { status: 'done' }]`).
  - If a tuple key is passed, only the exact query with that key will be refetched (e.g. `['todos', { status: 'done' }]` will only refetch queries with that exact key).
  - If a tuple key is passed with the `variables` slot set to `false`, then only queries that match the `string` key and have no variables will be refetched (e.g. `['todos', false]` would only refetch `todos` and not `['todos', { status: 'done' }]`).
- `force: Boolean`
  - Optional
  - Set this to `true` to force all queries to refetch instead of only stale ones.

### Returns

- `promise: Promise`
  - A promise is returned that will either resolve when all refetch queries are complete or will reject if any refetch queries fail (after their respective retry configurations are done).

## `refetchAllQueries`

`refetchAllQueries` is a function for imperatively triggering a refetch of all queries. By default, it will only refetch stale queries, but the `force` option can be used to refetch all queries, including non-stale ones.

```js
import { refetchAllQueries } from 'react-query'

const promise = refetchAllQueries({ force, includeInactive })
```

### Options

- `force: Boolean`
  - Optional
  - Set this to `true` to force all queries to refetch instead of only stale ones.
- `includeInactive: Boolean`
  - Optional
  - Set this to `true` to also refetch inactive queries.
  - Overrides the `force` option to be `true`, regardless of it's value.

### Returns

- `promise: Promise`
  - A promise is returned that will either resolve when all refetch queries are complete or will reject if any refetch queries fail (after their respective retry configurations are done).

## `useIsFetching`

`useIsFetching` is an optional hook that returns `true` if any query in your application is loading or fetching in the background (useful for app-wide loading indicators).

```js
import { useIsFetching } from 'react-query'

const isFetching = useIsFetching()
```

### Returns

- `isFetching: Boolean`
  - Will be `true` if any query in your application is loading or fetching in the background.

## `prefetchQuery`

`prefetchQuery` is a function that can be used to fetch and cache a query response for later before it is needed or rendered with `useQuery`. **Please note** that `prefetch` will not trigger a query fetch if the query is already cached. If you wish, you can force a prefetch for non-stale queries by using the `force` option:

```js
import { prefetchQuery } from 'react-query'

const data = await prefetchQuery(queryKey, queryFn, { force, ...config })
```

### Options

The options for `prefetchQuery` are exactly the same as those of [`useQuery`](#usequery), with the exception of a `force` option:

- `force: Boolean`
  - Optional
  - Set this to `true` to prefetch a query **even if it is stale**.

### Returns

- `promise: Promise`
  - A promise is returned that will either resolve with the **query's response data**, or throw with an **error**.

## `clearQueryCache`

`clearQueryCache` does exactly what it sounds like, it clears all query caches. It does this by:

- Immediately deleting any queries that do not have active subscriptions.
- Immediately setting `data` to `null` for all queries with active subscriptions.

```js
import { clearQueryCache } from 'react-query'

clearQueryCache()
```

## `ReactQueryConfigProvider`

`ReactQueryConfigProvider` is an optional provider component and can be used to define defaults for all instances of `useQuery` within it's sub-tree:

```js
import { ReactQueryConfigProvider } from 'react-query'

const queryConfig = {
  retry: 3,
  retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  staleTime: 0,
  cacheTime: 5 * 60 * 1000,
  refetchAllOnWindowFocus: true,
  refetchInterval: false,
  suspense: false,
}

function App() {
  return (
    <ReactQueryConfigProvider config={queryConfig}>
      ...
    </ReactQueryConfigProvider>
  )
}
```

### Options

- `config: Object`
  - Must be **stable** or **memoized**. Do not create an inline object!
  - For a description of all config options, please see the [`useQuery` hook](#usequery).
