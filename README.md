![React Query Header](https://github.com/tannerlinsley/react-query/raw/master/media/header.png)

<img src='https://github.com/tannerlinsley/react-query/raw/master/media/logo.png' width='300'/>

Hooks for fetching, caching and updating asynchronous data in React

<a href="https://twitter.com/intent/tweet?button_hashtag=TanStack" target="\_parent">
  <img alt="#TanStack" src="https://img.shields.io/twitter/url?color=%2308a0e9&label=%23TanStack&style=social&url=https%3A%2F%2Ftwitter.com%2Fintent%2Ftweet%3Fbutton_hashtag%3DTanStack">
</a><a href="https://github.com/tannerlinsley/react-query/actions?query=workflow%3A%22react-query+tests%22">
<img src="https://github.com/tannerlinsley/react-query/workflows/react-query%20tests/badge.svg" />
</a><a href="https://npmjs.com/package/react-query" target="\_parent">
  <img alt="" src="https://img.shields.io/npm/dm/react-query.svg" />
</a><a href="https://bundlephobia.com/result?p=react-query@latest" target="\_parent">
  <img alt="" src="https://badgen.net/bundlephobia/minzip/react-query@latest" />
</a><a href="#badge">
    <img alt="semantic-release" src="https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg">
  </a><a href="https://github.com/tannerlinsley/react-query/discussions">
  <img alt="Join the discussion on Github" src="https://img.shields.io/badge/Github%20Discussions%20%26%20Support-Chat%20now!-blue" />
</a><a href="https://github.com/tannerlinsley/react-query" target="\_parent">
  <img alt="" src="https://img.shields.io/github/stars/tannerlinsley/react-query.svg?style=social&label=Star" />
</a><a href="https://twitter.com/tannerlinsley" target="\_parent">
  <img alt="" src="https://img.shields.io/twitter/follow/tannerlinsley.svg?style=social&label=Follow" />
</a>

Enjoy this library? Try them all! [React Table](https://github.com/tannerlinsley/react-table), [React Form](https://github.com/tannerlinsley/react-form), [React Charts](https://github.com/tannerlinsley/react-charts)

## Quick Features

- Transport/protocol/backend agnostic data fetching (REST, GraphQL, promises, whatever!)
- Auto Caching + Refetching (stale-while-revalidate, Window Refocus, Polling/Realtime)
- Parallel + Dependent Queries
- Mutations + Reactive Query Refetching
- Multi-layer Cache + Automatic Garbage Collection
- Paginated + Cursor-based Queries
- Load-More + Infinite Scroll Queries w/ Scroll Recovery
- Request Cancellation
- [React Suspense](https://reactjs.org/docs/concurrent-mode-suspense.html) + Fetch-As-You-Render Query Prefetching
- [Dedicated Devtools (React Query Devtools)](https://github.com/tannerlinsley/react-query-devtools)
- 4kb - 6kb (depending on features imported) <a href="https://bundlephobia.com/result?p=react-query@latest" target="\_parent">
  <img alt="" src="https://badgen.net/bundlephobia/minzip/react-query@latest" />
  </a>

<details>
<summary>Core Issues and Solution</summary>

## The Challenge

Tools for managing "global state" are plentiful these days, but most of these tools:

- Mistake **server cache state** for **global state**
- Force you to manage async data in a synchronous way
- Duplicate unnecessary network operations
- Use naive or over-engineered caching strategies
- Are too basic to handle large-scale apps or
- Are too complex or built for highly-opinionated systems like Redux, GraphQL, [insert proprietary tools], etc.
- Do not provide tools for server mutations
- Either do not provide easy access to the cache or do, but expose overpowered foot-gun APIs to the developer

## The Solution

React Query exports a set of hooks that address these issues. Out of the box, React Query:

- Separates your **server cache state** from your **global state**
- Provides async aware APIs for reading and updating server state/cache
- Dedupes both async and sync requests to async resources
- Automatically caches data, invalidates and refetches stale data, and manages garbage collection of unused data
- Scales easily as your application grows
- Is based solely on Promises, making it highly unopinionated and interoperable with any data fetching strategy including REST, GraphQL and other transactional APIs
- Provides an integrated promise-based mutation API
- Opt-in Manual or Advance cache management

</details>

<details>
<summary>Inspiration & Hat-Tipping</summary>
<br />
A big thanks to both [Draqula](https://github.com/vadimdemedes/draqula) for inspiring a lot of React Query's original API and documentation and also [Zeit's SWR](https://github.com/zeit/swr) and its creators for inspiring even further customizations and examples. You all rock!

</details>

<details>
<summary>How is this different from Zeit's SWR?</summary>
<br />

[Zeit's SWR](https://github.com/zeit/swr) is a great library, and is very similar in spirit and implementation to React Query with a few notable differences:

- Automatic Cache Garbage Collection - React Query handles automatic cache purging for inactive queries and garbage collection. This can mean a much smaller memory footprint for apps that consume a lot of data or data that is changing often in a single session
- No Default Data Fetcher Function - React Query does not ship with a default fetcher (but can easily be wrapped inside of a custom hook to achieve the same functionality)
- `useMutation` - A dedicated hook for handling generic lifecycles around triggering mutations and handling their side-effects in applications. SWR does not ship with anything similar, and you may find yourself reimplementing most if not all of `useMutation`'s functionality in user-land. With this hook, you can extend the lifecycle of your mutations to reliably handle successful refetching strategies, failure rollbacks and error handling.
- Prefetching - React Query ships with 1st class prefetching utilities which not only come in handy with non-suspenseful apps but also make fetch-as-you-render patterns possible with React Query. SWR does not come with similar utilities and relies on `<link rel='preload'>` and/or manually fetching and updating the query cache
- Query cancellation integration is baked into React Query. You can easily use this to wire up request cancellation in most popular fetching libraries, including but not limited to fetch and axios.
- Query Key Generation - React Query uses query key generation, query variables, and implicit query grouping. The query key and variables that are passed to a query are less URL/Query-based by nature and much more flexible. All items supplied to the query key array are used to compute the unique key for a query (using a stable and deterministic sorting/hashing implementation). This means you can spend less time thinking about precise key matching, but more importantly, allows you to use partial query-key matching when refetching, updating, or removing queries in mass eg. you can refetch every query that starts with a `todos` in its key, regardless of variables, or you can target specific queries with (or without) variables, and even use functional filtering to select queries in most places. This architecture is much more robust and forgiving especially for larger apps.

</details>

## Used By

- [Google](https://google.com)
- [PayPal](https://paypal.com)
- [Amazon](https://amazon.com)
- [Walmart](https://walmart.com)
- [Microsoft](https://microsoft.com)
- [Target](https://target.com)
- [HP](https://hp.com)
- [Major League Baseball Association](https://www.mlb.com)
- [Volvo](https://www.volvocars.com)
- [Ocado](https://ocado.com)
- [UPC.ch](https://upc.ch)
- [EFI.com](https://efi.com)
- [ReactBricks](https://www.reactbricks.com/)
- [Nozzle.io](https://nozzle.io)

> _These analytics are made available via the awesome [Scarf](https://www.npmjs.com/package/@scarf/scarf) package analytics library_

## Examples

- Basic - [CodeSandbox](https://codesandbox.io/s/github/tannerlinsley/react-query/tree/master/examples/basic) - [Source](./examples/basic)
- Custom Hooks - [CodeSandbox](https://codesandbox.io/s/github/tannerlinsley/react-query/tree/master/examples/custom-hooks) - [Source](./examples/custom-hooks)
- Auto Refetching / Polling / Realtime - [CodeSandbox](https://codesandbox.io/s/github/tannerlinsley/react-query/tree/master/examples/auto-refetching) - [Source](./examples/auto-refetching)
- Window Refocus Refetching - [CodeSandbox](https://codesandbox.io/s/github/tannerlinsley/react-query/tree/master/examples/focus-refetching) - [Source](./examples/focus-refetching)
- Optimistic Updates - [CodeSandbox](https://codesandbox.io/s/github/tannerlinsley/react-query/tree/master/examples/optimistic-updates) - [Source](./examples/optimistic-updates)
- Pagination - [CodeSandbox](https://codesandbox.io/s/github/tannerlinsley/react-query/tree/master/examples/pagination) - [Source](./examples/pagination)
- Load-More & Infinite Scroll - [CodeSandbox](https://codesandbox.io/s/github/tannerlinsley/react-query/tree/master/examples/load-more-infinite-scroll) - [Source](./examples/load-more-infinite-scroll)
- Suspense - [CodeSandbox](https://codesandbox.io/s/github/tannerlinsley/react-query/tree/master/examples/suspense) - [Source](./examples/suspense)
- Playground (with devtools) - [CodeSandbox](https://codesandbox.io/s/github/tannerlinsley/react-query/tree/master/examples/playground) - [Source](./examples/playground)
- Star Wars (with devtools) - [CodeSandbox](https://codesandbox.io/s/github/tannerlinsley/react-query/tree/master/examples/star-wars) - [Source](./examples/star-wars)
- Rick And Morty (with devtools) - [CodeSandbox](https://codesandbox.io/s/github/tannerlinsley/react-query/tree/master/examples/rick-morty) - [Source](./examples/rick-morty)

## Sponsors

This library is being built and maintained by me, @tannerlinsley and I am always in need of more support to keep projects like this afloat. If you would like to get premium support, add your logo or name on this README, or simply just contribute to my open source Sponsorship goal, [visit my Github Sponsors page!](https://github.com/sponsors/tannerlinsley/)

[![Diamond Sponsors](https://raw.githubusercontent.com/tannerlinsley/files/master/sponsorships/diamond.png)](https://github.com/sponsors/tannerlinsley)

<table>
  <tbody>
    <tr>
      <td>
        <a href="https://github.com/sponsors/tannerlinsley" target="_blank">
          Get Your Logo Here!
        </a>
      </td>
    </tr>
  </tbody>
</table>

[![Gold Sponsors](https://raw.githubusercontent.com/tannerlinsley/files/master/sponsorships/gold.png)](https://github.com/sponsors/tannerlinsley)

<table>
  <tbody>
    <tr>
      <td>
        <a href="https://github.com/sponsors/tannerlinsley" target="_blank">
          Get Your Logo Here!
        </a>
      </td>
    </tr>
  </tbody>
</table>

[![Silver Sponsors](https://raw.githubusercontent.com/tannerlinsley/files/master/sponsorships/silver.png)](https://github.com/sponsors/tannerlinsley)

<table>
  <tbody>
    <tr>
      <td>
        <a href="https://www.reactbricks.com/" target="_blank">
          <img width='225' src="https://www.reactbricks.com/reactbricks_vertical.svg">
        </a>
      </td>
    </tr>
  </tbody>
</table>

[![Bronze Sponsors](https://raw.githubusercontent.com/tannerlinsley/files/master/sponsorships/bronze.png)](https://github.com/sponsors/tannerlinsley)

<table>
  <tbody>
    <tr>
      <td>
        <a href="https://nozzle.io" target="_blank">
          <img width='150' src="https://nozzle.io/img/logo-blue.png">
        </a>
      </td>
    </tr>
  </tbody>
</table>

[![Supporters](https://raw.githubusercontent.com/tannerlinsley/files/master/sponsorships/supporters.png)](https://github.com/sponsors/tannerlinsley)

- <a href="https://github.com/bgazzera">@bgazzera<a></li>
- <a href="https://kentcdodds.com/"> Kent C. Dodds (kentcdodds.com)</a></li>

[![Fans](https://raw.githubusercontent.com/tannerlinsley/files/master/sponsorships/fans.png)](https://github.com/sponsors/tannerlinsley)

- Steven Miyakawa (@SamSamskies)

### [Become a Sponsor](https://github.com/sponsors/tannerlinsley/)

# Documentation

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Installation](#installation)
- [Defaults to keep in mind](#defaults-to-keep-in-mind)
- [Queries](#queries)
  - [Query Keys](#query-keys)
  - [Query Key Variables](#query-key-variables)
  - [Optional Variables](#optional-variables)
  - [Using a Query Object instead of parameters](#using-a-query-object-instead-of-parameters)
  - [Dependent Queries](#dependent-queries)
  - [Caching & Invalidation](#caching--invalidation)
  - [Paginated Queries with `usePaginatedQuery`](#paginated-queries-with-usepaginatedquery)
  - [Load-More & Infinite-Scroll with `useInfiniteQuery`](#load-more--infinite-scroll-with-useinfinitequery)
  - [Scroll Restoration](#scroll-restoration)
  - [Manual Querying](#manual-querying)
  - [Retries](#retries)
  - [Retry Delay](#retry-delay)
  - [Prefetching](#prefetching)
  - [Initial Data](#initial-data)
  - [Initial Data Function](#initial-data-function)
  - [Initial Data from Cache](#initial-data-from-cache)
  - [SSR & Initial Data](#ssr--initial-data)
  - [Suspense Mode](#suspense-mode)
  - [Fetch-on-render vs Fetch-as-you-render](#fetch-on-render-vs-fetch-as-you-render)
  - [Canceling Query Requests](#canceling-query-requests)
- [Mutations](#mutations)
  - [Basic Mutations](#basic-mutations)
  - [Mutation Variables](#mutation-variables)
  - [Invalidate and Refetch Queries from Mutations](#invalidate-and-refetch-queries-from-mutations)
  - [Query Updates from Mutations](#query-updates-from-mutations)
  - [Resetting Mutation State](#resetting-mutation-state)
  - [Manually or Optimistically Setting Query Data](#manually-or-optimistically-setting-query-data)
  - [Optimistic Updates with Automatic Rollback for Failed Mutations](#optimistic-updates-with-automatic-rollback-for-failed-mutations)
- [Displaying Background Fetching Loading States](#displaying-background-fetching-loading-states)
- [Displaying Global Background Fetching Loading State](#displaying-global-background-fetching-loading-state)
- [Window-Focus Refetching](#window-focus-refetching)
  - [Custom Window Focus Event](#custom-window-focus-event)
  - [Ignoring Iframe Focus Events](#ignoring-iframe-focus-events)
- [Custom Query Key Serializers (Experimental)](#custom-query-key-serializers-experimental)
- [React Query Devtools](#react-query-devtools)
- [API](#api)
  - [`useQuery`](#usequery)
  - [`usePaginatedQuery`](#usepaginatedquery)
  - [`useInfiniteQuery`](#useinfinitequery)
  - [`useMutation`](#usemutation)
  - [`queryCache`](#querycache)
  - [`queryCache.prefetchQuery`](#querycacheprefetchquery)
  - [`queryCache.getQueryData`](#querycachegetquerydata)
  - [`queryCache.setQueryData`](#querycachesetquerydata)
  - [`queryCache.refetchQueries`](#querycacherefetchqueries)
  - [`queryCache.cancelQueries`](#querycachecancelqueries)
  - [`queryCache.removeQueries`](#querycacheremovequeries)
  - [`queryCache.getQuery`](#querycachegetquery)
  - [`queryCache.getQueries`](#querycachegetqueries)
  - [`queryCache.isFetching`](#querycacheisfetching)
  - [`queryCache.subscribe`](#querycachesubscribe)
  - [`queryCache.clear`](#querycacheclear)
  - [`useQueryCache`](#usequerycache)
  - [`useIsFetching`](#useisfetching)
  - [`ReactQueryConfigProvider`](#reactqueryconfigprovider)
  - [`ReactQueryCacheProvider`](#reactquerycacheprovider)
  - [`setConsole`](#setconsole)
- [Contributors ✨](#contributors-)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Installation

```bash
$ npm i --save react-query
# or
$ yarn add react-query
```

React Query uses [Scarf](https://www.npmjs.com/package/@scarf/scarf) to collect anonymized installation analytics. These analytics help support the maintainers of this library. However, if you'd like to opt out, you can do so by setting `scarfSettings.enabled = false` in your project's `package.json`. Alternatively, you can set the environment variable `SCARF_ANALYTICS=false` before you install.

# Defaults to keep in mind

Out of the box, React Query is configured with **aggressive but sane** defaults. **Sometimes these defaults can catch new users off guard or make learning/debugging difficult if they are unknown by the user.** Keep them in mind as you continue to learn and use React Query:

- Query results that are _currently rendered on the screen_ will become "stale" immediately after they are resolved and will be refetched automatically in the background when they are rendered or used again. To change this, you can alter the default `staleTime` for queries to something other than `0` milliseconds.
- Query results that become unused (all instances of the query are unmounted) will still be cached in case they are used again for a default of 5 minutes before they are garbage collected. To change this, you can alter the default `cacheTime` for queries to something other than `1000 * 60 * 5` milliseconds.
- Stale queries will automatically be refetched in the background **when the browser window is refocused by the user**. You can disable this using the `refetchOnWindowFocus` option in queries or the global config.
- Queries that fail will silently and automatically be retried **3 times, with exponential backoff delay** before capturing and displaying an error to the UI. To change this, you can alter the default `retry` and `retryDelay` options for queries to something other than `3` and the default exponential backoff function.
- Query results by default are deep compared to detect if data has actually changed and if not, the data reference remains unchanged to better help with value stabilization with regards to useMemo and useCallback. The default deep compare function use here (`config.isDataEqual`) only supports comparing JSON-compatible primitives. If you are dealing with any non-json compatible values in your query responses OR are seeing performance issues with the deep compare function, you should probably disable it (`config.isDataEqual = () => false`) or customize it to better fit your needs.

# Queries

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

At its core, React Query manages query caching for you and uses a serializable array or "query key" to do this. Using a query key that is **simple** and **unique to the query's data** is very important. In other similar libraries, you'll see the use of URLs and/or GraphQL query template strings to achieve this, but we believe at scale, this becomes prone to typos and errors. To relieve this issue, React Query Keys can be **strings** or **an array with a string and then any number of serializable primitives and/or objects**.

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
  const { status, data, error } = useQuery(
    ['todos', { status, page }],
    fetchTodoList
  )
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
  const { status, data, error } = useQuery(
    ['todo', todoId, { preview }],
    fetchTodoById
  )
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
  const { status, data, error } = useQuery(['todo', todoId], fetchTodo)
}
```

## Optional Variables

In some scenarios, you may find yourself needing to pass extra information to your query that shouldn't (or doesn't need to be) a part of the query key. `useQuery`, `usePaginatedQuery` and `useInfiniteQuery` all support passing an optional array of additional parameters to be passed to your query function:

```js
function Todo({ todoId, preview }) {
  const { status, data, error } = useQuery(
    // These will be used as the query key
    ['todo', todoId],
    // These will get passed directly to our query function
    [
      debug,
      {
        foo: true,
        bar: false,
      },
    ],
    fetchTodoById
  )
}

function fetchTodoById(key, todoId, debug, { foo, bar }) {
  return new Promise()
  // ...
}
```

## Using a Query Object instead of parameters

Anywhere the `[queryKey, variables, queryFn, config]` options are supported throughout React Query's API, you can also use an object to express the same configuration:

```js
import { useQuery } from 'react-query'

useQuery({
  queryKey: ['todo', 7],
  queryFn: fetchTodos,
  variables: [],
  config: {},
})
```

## Dependent Queries

React Query makes it easy to make queries that depend on other queries for both:

- Parallel Queries (avoiding waterfalls) and
- Serial Queries (when a piece of data is required for the next query to happen).

To do this, you can use the following 2 approaches:

### Pass a falsy query key

If a query isn't ready to be requested yet, just pass a falsy value as the query key or as an item in the query key:

```js
// Get the user
const { data: user } = useQuery(['user', email], getUserByEmail)

// Then get the user's projects
const { data: projects } = useQuery(
  // `user` would be `null` at first (falsy),
  // so the query will not execute while the query key is falsy
  user && ['projects', user.id],
  getProjectsByUser
)
```

### Use a query key function that throws an exception

If a function is passed, the query will not execute until the function can be called without throwing:

```js
// Get the user
const { data: user } = useQuery(['user', email])

// Then get the user's projects
const { data: projects } = useQuery(
  // This will throw trying to access property `id` of `undefined` until the `user` is available
  () => ['projects', user.id]
)
```

## Caching & Invalidation

React Query caching is automatic out of the box. It uses a `stale-while-revalidate` in-memory caching strategy together with robust query deduping to always ensure a query's data is only cached when it's needed and only cached once even if that query is used multiple times across your application.

At a glance:

- The cache is keyed on a deterministic hash of your query key.
- By default, query results become **stale** immediately after a successful fetch. This can be configured using the `staleTime` option at both the global and query-level.
- Stale queries are automatically refetched whenever their **query keys change (this includes variables used in query key tuples)**, when they are freshly mounted from not having any instances on the page, or when they are refetched via the query cache manually.
- Though a query result may be stale, query results are by default **always** _cached_ **when in use**.
- If and when a query is no longer being used, it becomes **inactive** and by default is cached in the background for **5 minutes**. This time can be configured using the `cacheTime` option at both the global and query-level.
- After a query is inactive for the `cacheTime` specified (defaults to 5 minutes), the query is deleted and garbage collected.

<details>
 <summary>A more detailed example of the caching lifecycle</summary>

Let's assume we are using the default `cacheTime` of **5 minutes** and the default `staleTime` of `0`.

- A new instance of `useQuery('todos', fetchTodos)` mounts.
  - Since no other queries have been made with this query + variable combination, this query will show a hard loading state and make a network request to fetch the data.
  - It will then cache the data using `'todos'` and `fetchTodos` as the unique identifiers for that cache.
  - A stale invalidation is scheduled using the `staleTime` option as a delay (defaults to `0`, or immediately).
- A second instance of `useQuery('todos', fetchTodos)` mounts elsewhere.
  - Because this exact data exist in the cache from the first instance of this query, that data is immediately returned from the cache.
- Both instances of the `useQuery('todos', fetchTodos)` query are unmounted and no longer in use.
  - Since there are no more active instances to this query, a cache timeout is set using `cacheTime` to delete and garbage collect the query (defaults to **5 minutes**).
- No more instances of `useQuery('todos', fetchTodos)` appear within **5 minutes**.
  - This query and its data are deleted and garbage collected.

</details>

## Paginated Queries with `usePaginatedQuery`

Rendering paginated data is a very common UI pattern to avoid overloading bandwidth or even your UI. React Query exposes a `usePaginatedQuery` that is very similar to `useQuery` that helps with this very scenario.

Consider the following example where we would ideally want to increment a pageIndex (or cursor) for a query. If we were to use `useQuery`, it would technically work fine, but the UI would jump in and out of the `success` and `loading` states as different queries are created and destroyed for each page or cursor. By using `usePaginatedQuery` we get a few new things:

- Instead of `data`, you should use `resolvedData` instead. This is the data from the last known successful query result. As new page queries resolve, `resolvedData` remains available to show the last page's data while a new page is requested. When the new page data is received, `resolvedData` get's updated to the new page's data.
- If you specifically need the data for the exact page being requested, `latestData` is available. When the desired page is being requested, `latestData` will be `undefined` until the query resolves, then it will get updated with the latest pages data result.

```js
function Todos() {
  const [page, setPage] = React.useState(0)

  const fetchProjects = (key, page = 0) => fetch('/api/projects?page=' + page)

  const {
    status,
    resolvedData,
    latestData,
    error,
    isFetching,
  } = usePaginatedQuery(['projects', page], fetchProjects)

  return (
    <div>
      {status === 'loading' ? (
        <div>Loading...</div>
      ) : status === 'error' ? (
        <div>Error: {error.message}</div>
      ) : (
        // `resolvedData` will either resolve to the latest page's data
        // or if fetching a new page, the last successful page's data
        <div>
          {resolvedData.projects.map(project => (
            <p key={project.id}>{project.name}</p>
          ))}
        </div>
      )}
      <span>Current Page: {page + 1}</span>
      <button
        onClick={() => setPage(old => Math.max(old - 1, 0))}
        disabled={page === 0}
      >
        Previous Page
      </button>{' '}
      <button
        onClick={() =>
          // Here, we use `latestData` so the Next Page
          // button isn't relying on potentially old data
          setPage(old => (!latestData || !latestData.hasMore ? old : old + 1))
        }
        disabled={!latestData || !latestData.hasMore}
      >
        Next Page
      </button>
      {// Since the last page's data potentially sticks around between page requests,
      // we can use `isFetching` to show a background loading
      // indicator since our `status === 'loading'` state won't be triggered
      isFetching ? <span> Loading...</span> : null}{' '}
    </div>
  )
}
```

## Load-More & Infinite-Scroll with `useInfiniteQuery`

Rendering lists that can additively "load more" data onto an existing set of data or "infinite scroll" is also a very common UI pattern. React Query supports a useful version of `useQuery` called `useInfiniteQuery` for querying these types of lists.

When using `useInfiniteQuery`, you'll notice a few things are different:

- `data` is now an array of arrays that contain query group results, instead of the query results themselves
- A `fetchMore` function is now available
- A `getFetchMore` option is available for both determining if there is more data to load and the information to fetch it. This information is supplied as an additional parameter in the query function (which can optionally be overridden when calling the `fetchMore` function)
- A `canFetchMore` boolean is now available and is `true` if `getFetchMore` returns a truthy value
- An `isFetchingMore` boolean is now available to distinguish between a background refresh state and a loading more state

### Example

Let's assume we have an API that returns pages of `projects` 3 at a time based on a `cursor` index along with a cursor that can be used to fetch the next group of projects

```js
fetch('/api/projects?cursor=0')
// { data: [...], nextCursor: 3}
fetch('/api/projects?cursor=3')
// { data: [...], nextCursor: 6}
fetch('/api/projects?cursor=6')
// { data: [...], nextCursor: 9}
fetch('/api/projects?cursor=9')
// { data: [...] }
```

With this information, we can create a "Load More" UI by:

- Waiting for `useInfiniteQuery` to request the first group of data by default
- Returning the information for the next query in `getFetchMore`
- Calling `fetchMore` function

> Note: It's very important you do not call `fetchMore` with arguments unless you want them to override the `fetchMoreInfo` data returned from the `getFetchMore` function. eg. Do not do this: `<button onClick={fetchMore} />` as this would send the onClick event to the `fetchMore` function.

```js
import { useInfiniteQuery } from 'react-query'

function Projects() {
  const fetchProjects = (key, cursor = 0) =>
    fetch('/api/projects?cursor=' + cursor)

  const {
    status,
    data,
    isFetching,
    isFetchingMore,
    fetchMore,
    canFetchMore,
  } = useInfiniteQuery('projects', fetchProjects, {
    getFetchMore: (lastGroup, allGroups) => lastGroup.nextCursor,
  })

  return status === 'loading' ? (
    <p>Loading...</p>
  ) : status === 'error' ? (
    <p>Error: {error.message}</p>
  ) : (
    <>
      {data.map((group, i) => (
        <React.Fragment key={i}>
          {group.projects.map(project => (
            <p key={project.id}>{project.name}</p>
          ))}
        </React.Fragment>
      ))}
      <div>
        <button
          onClick={() => fetchMore()}
          disabled={!canFetchMore || isFetchingMore}
        >
          {isFetchingMore
            ? 'Loading more...'
            : canFetchMore
            ? 'Load More'
            : 'Nothing more to load'}
        </button>
      </div>
      <div>{isFetching && !isFetchingMore ? 'Fetching...' : null}</div>
    </>
  )
}
```

### What happens when an infinite query needs to be refetched?

When an infinite query becomes `stale` and needs to be refetched, each group is fetched `sequentially`, starting from the first one. This ensures that even if the underlying data is mutated we're not using stale cursors and potentially getting duplicates or skipping records. If an infinite query's results are ever removed from the cache, the pagination restarts at the initial state with only the initial group being requested.

### What if I need to pass custom information to my query function?

By default, the info returned from `getFetchMore` will be supplied to the query function, but in some cases, you may want to override this. You can pass custom variables to the `fetchMore` function which will override the default info like so:

```js
function Projects() {
  const fetchProjects = (key, cursor = 0) =>
    fetch('/api/projects?cursor=' + cursor)

  const {
    status,
    data,
    isFetching,
    isFetchingMore,
    fetchMore,
    canFetchMore,
  } = useInfiniteQuery('projects', fetchProjects, {
    getFetchMore: (lastGroup, allGroups) => lastGroup.nextCursor,
  })

  // Pass your own custom fetchMoreInfo
  const skipToCursor50 = () => fetchMore(50)
}
```

## Scroll Restoration

Out of the box, "scroll restoration" for all queries (including paginated and infinite queries) Just Works™️ in React Query. The reason for this is that query results are cached and able to be retrieved synchronously when a query is rendered. As long as your queries are being cached long enough (the default time is 5 minutes) and have not been garbage collected, scroll restoration will work out of the box all the time.

## Manual Querying

If you ever want to disable a query from automatically running, you can use the `manual = true` option. When `manual` is set to true:

- The query will start in the `status === 'success'` state
- The query will not automatically fetch on mount
- The query will not automatically refetch due to rerenders, new instances appearing, or changes to its query key or variables.

> Pro Tip #1: Because manual queries start in the `status === 'success'` state, you should consider supplying an `initialData` option to pre-populate the cache or similarly use a default parameter value when destructuring the query result

> Pro Tip #2: Don't use `manual` for dependent queries. Use [Dependent Queries](#dependent-queries) instead!

```js
function Todos() {
  const { status, data, error, refetch, isFetching } = useQuery(
    'todos',
    fetchTodoList,
    {
      manual: true,
      initialData: [],
    }
  )

  return (
    <>
      <button onClick={() => refetch()}>Fetch Todos</button>

      {status === 'loading' ? (
        <span>Loading...</span>
      ) : status === 'error' ? (
        <span>Error: {error.message}</span>
      ) : (
        // `status === 'success'` will be the initial state, so we need
        // account for our initial data (an empty array)
        <>
          <ul>
            {!data.length
              ? 'No todos yet...'
              : data.map(todo => <li key={todo.id}>{todo.title}</li>)}
          </ul>
          <div>{isFetching ? 'Fetching...' : null}</div>
        </>
      )}
    </>
  )
}
```

## Retries

When a `useQuery` query fails (the function throws an error), React Query will automatically retry the query if that query's request has not reached the max number of consecutive retries (defaults to `3`) or a function is provided to determine if a retry is allowed.

You can configure retries both on a global level and an individual query level.

- Setting `retry = false` will disable retries.
- Setting `retry = 6` will retry failing requests 6 times before showing the final error thrown by the function.
- Setting `retry = true` will infinitely retry failing requests.
- Setting `retry = (failureCount, error) => ...` allows for custom logic based on why the request failed.

```js
import { useQuery } from 'react-query'

// Make specific query retry a certain number of times
const { status, data, error } = useQuery(['todos', 1], fetchTodoListPage, {
  retry: 10, // Will retry failed requests 10 times before displaying an error
})
```

## Retry Delay

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
const { status, data, error } = useQuery('todos', fetchTodoList, {
  retryDelay: 1000, // Will always wait 1000ms to retry, regardless of how many retries
})
```

## Prefetching

If you're lucky enough, you may know enough about what your users will do to be able to prefetch the data they need before it's needed! If this is the case, then you're in luck. You can either use the `prefetchQuery` function to prefetch the results of a query to be placed into the cache:

```js
import { queryCache } from 'react-query'

const prefetchTodos = async () => {
  const queryData = await queryCache.prefetchQuery('todos', () =>
    fetch('/todos')
  )
  // The results of this query will be cached like a normal query
}
```

The next time a `useQuery` instance is used for a prefetched query, it will use the cached data! If no instances of `useQuery` appear for a prefetched query, it will be deleted and garbage collected after the time specified in `cacheTime`.

Alternatively, if you already have the data for your query synchronously available, you can use the [Query Cache's `setQueryData` method](#querycachesetquerydata) to directly add or update a query's cached result

## Initial Data

There may be times when you already have the initial data for a query synchronously available in your app. If and when this is the case, you can use the `config.initialData` option to set the initial data for a query and skip the first round of fetching!

When providing an `initialData` value that is anything other than `undefined`:

- The query `status` will initialize as `success` instead of `loading`
- The query's `isStale` property will initialize as `true` instead of false
- The query will not automatically fetch until it is invalidated somehow (eg. window refocus, queryCache refetching, etc)

```js
function Todos() {
  const queryInfo = useQuery('todos', () => fetch('/todos'), {
    initialData: initialTodos,
  })
}
```

## Initial Data Function

If the process for accessing a query's initial data is intensive or just not something you want to perform on every render, you can pass a function as the `initialData` value. This function will be executed only once when the query is initialized, saving you precious memory and CPU:

```js
function Todos() {
  const queryInfo = useQuery('todos', () => fetch('/todos'), {
    initialData: () => {
      return getExpensiveTodos()
    },
  })
}
```

## Initial Data from Cache

In some circumstances, you may be able to provide the initial data for a query from the cached result of another. A good example of this would be searching the cached data from a todos list query for an individual todo item, then using that as the initial data for your individual todo query:

```js
function Todo({ todoId }) {
  const queryInfo = useQuery(['todo', todoId], () => fetch('/todos'), {
    initialData: () => {
      // Use a todo from the 'todos' query as the initial data for this todo query
      return queryCache.getQueryData('todos')?.find(d => d.id === todoId)
    },
  })
}
```

Most of the time, this pattern works well, but if the source query you're using to look up the initial data from is old, you may not want to use the data at all and just fetch from the server. To make this decision easier, you can use the `queryCache.getQuery` method instead to get more information about the source query, including a `query.state.updatedAt` timestamp you can use to decide if the query is "fresh" enough for your needs:

```js
function Todo({ todoId }) {
  const queryInfo = useQuery(['todo', todoId], () => fetch('/todos'), {
    initialData: () => {
      // Get the query object
      const query = queryCache.getQuery('todos')

      // If the query exists and has data that is no older than 10 seconds...
      if (query && Date.now() - query.state.updatedAt <= 10 * 1000) {
        // return the individual todo
        return query.state.data.find(d => d.id === todoId)
      }

      // Otherwise, return undefined and let it fetch!
    },
  })
}
```

## SSR & Initial Data

When using SSR (server-side-rendering) with React Query there are a few things to note:

- Query caches are not written to memory during SSR. This is outside of the scope of React Query and easily leads to out-of-sync data when used with frameworks like Next.js or other SSR strategies.
- Queries rendered on the server will by default use the `initialData` of an unfetched query. This means that by default, `data` will be set to `undefined`. To get around this in SSR, you can either pre-seed a query's cache data using the `config.initialData` option:

```js
const { status, data, error } = useQuery('todos', fetchTodoList, {
  initialData: [{ id: 0, name: 'Implement SSR!' }],
})

// data === [{ id: 0, name: 'Implement SSR!'}]
```

Or, alternatively you can just destructure from `undefined` in your query results:

```js
const { status, data = [{ id: 0, name: 'Implement SSR!' }], error } = useQuery(
  'todos',
  fetchTodoList
)
```

The query's state will still reflect that it is stale and has not been fetched yet, and once mounted, it will continue as normal and request a fresh copy of the query result.

## Suspense Mode

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
import { useQuery } from 'react-query'

// Enable for an individual query
useQuery(queryKey, queryFn, { suspense: true })
```

When using suspense mode, `status` states and `error` objects are not needed and are then replaced by usage of the `React.Suspense` component (including the use of the `fallback` prop and React error boundaries for catching errors). Please see the [Suspense Example](https://codesandbox.io/s/github/tannerlinsley/react-query/tree/master/examples/suspense) for more information on how to set up suspense mode.

In addition to queries behaving differently in suspense mode, mutations also behave a bit differently. By default, instead of supplying the `error` variable when a mutation fails, it will be thrown during the next render of the component it's used in and propagate to the nearest error boundary, similar to query errors. If you wish to disable this, you can set the `useErrorBoundary` option to `false`. If you wish that errors are not thrown at all, you can set the `throwOnError` option to `false` as well!

## Fetch-on-render vs Fetch-as-you-render

Out of the box, React Query in `suspense` mode works really well as a **Fetch-on-render** solution with no additional configuration. However, if you want to take it to the next level and implement a `Fetch-as-you-render` model, we recommend implementing [Prefetching](#prefetching) on routing and/or user interactions events to initialize queries before they are needed.

## Canceling Query Requests

By default, queries that become inactive before their promises are resolved are simply ignored instead of canceled. Why is this?

- For most applications, ignoring out-of-date queries is sufficient.
- Cancellation APIs may not be available for every query function.
- If cancellation APIs are available, they typically vary in implementation between utilities/libraries (eg. Fetch vs Axios vs XMLHttpRequest).

But don't worry! If your queries are high-bandwidth or potentially very expensive to download, React Query exposes a generic way to **cancel** query requests using a cancellation token or other related API. To integrate with this feature, attach a `cancel` function to the promise returned by your query that implements your request cancellation. When a query becomes out-of-date or inactive, this `promise.cancel` function will be called (if available):

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

# Mutations

Unlike queries, mutations are typically used to create/update/delete data or perform server side-effects. For this purpose, React Query exports a `useMutation` hook.

## Basic Mutations

Assuming the server implements a ping mutation, that returns "pong" string, here's an example of the most basic mutation:

```js
const PingPong = () => {
  const [mutate, { status, data, error }] = useMutation(pingMutation)

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

## Mutation Variables

To pass `variables` to your `mutate` function, call `mutate` with an object.

```js
// Notice how the fetcher function receives an object containing
// all possible variables
const createTodo = ({ title }) => {
  /* trigger an http request */
}

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

Even with just variables, mutations aren't all that special, but when used with the `onSuccess` option, the [Query Cache's `refetchQueries` method](#querycacherefetchqueries) method and the [Query Cache's `setQueryData` method](#querycachesetquerydata), mutations become a very powerful tool.

Note that since version 1.1.0, the `mutate` function is no longer called synchronously so you cannot use it in an event callback. If you need to access the event in `onSubmit` you need to wrap `mutate` in another function. This is due to [React event pooling](https://reactjs.org/docs/events.html#event-pooling).

```js
// This will not work
const CreateTodo = () => {
  const [mutate] = useMutation(event => {
    event.preventDefault()
    fetch('/api', new FormData(event.target))
  })

  return <form onSubmit={mutate}>...</form>
}

// This will work
const CreateTodo = () => {
  const [mutate] = useMutation(formData => {
    fetch('/api', formData)
  })
  const onSubmit = event => {
    event.preventDefault()
    mutate(new FormData(event.target))
  }

  return <form onSubmit={onSubmit}>...</form>
}
```

## Invalidate and Refetch Queries from Mutations

When a mutation succeeds, it's likely that other queries in your application need to update. Where other libraries that use normalized caches would attempt to update local queries with the new data imperatively, React Query helps you to avoid the manual labor that comes with maintaining normalized caches and instead prescribes **atomic updates and refetching** instead of direct cache manipulation.

For example, assume we have a mutation to post a new todo:

```js
const [mutate] = useMutation(postTodo)
```

When a successful `postTodo` mutation happens, we likely want all `todos` queries to get refetched to show the new todo item. To do this, you can use `useMutation`'s `onSuccess` options and the `queryCache`'s `refetchQueries`:

```js
import { useMutation, queryCache } from 'react-query'

// When this mutation succeeds, refetch any queries with the `todos` or `reminders` query key
const [mutate] = useMutation(addTodo, {
  onSuccess: () => {
    queryCache.refetchQueries('todos')
    queryCache.refetchQueries('reminders')
  },
})

mutate(todo)

// The 3 queries below will be refetched when the mutation above succeeds
const todoListQuery = useQuery('todos', fetchTodoList)
const todoListQuery = useQuery(['todos', { page: 1 }], fetchTodoList)
const remindersQuery = useQuery('reminders', fetchReminders)
```

You can even refetch queries with specific variables by passing a more specific query key to the `refetchQueries` method:

```js
const [mutate] = useMutation(addTodo, {
  onSuccess: () => {
    queryCache.refetchQueries(['todos', { type: 'done' }])
  },
})

mutate(todo)

// The query below will be refetched when the mutation above succeeds
const todoListQuery = useQuery(['todos', { type: 'done' }], fetchTodoList)
// However, the following query below will NOT be refetched
const todoListQuery = useQuery('todos', fetchTodoList)
```

The `refetchQueries` API is very flexible, so even if you want to **only** refetch `todos` queries that don't have any more variables or subkeys, you can pass an `exact: true` option to the `refetchQueries` method:

```js
const [mutate] = useMutation(addTodo, {
  onSuccess: () => {
    queryCache.refetchQueries('todos', { exact: true })
  },
})

mutate(todo)

// The query below will be refetched when the mutation above succeeds
const todoListQuery = useQuery(['todos'], fetchTodoList)
// However, the following query below will NOT be refetched
const todoListQuery = useQuery(['todos', { type: 'done' }], fetchTodoList)
```

If you find yourself wanting **even more** granularity, you can pass a predicate function to the `refetchQueries` method. This function will receive each query object from the queryCache and allow you to return `true` or `false` for whether you want to refetch that query:

```js
const [mutate] = useMutation(addTodo, {
  onSuccess: () => {
    queryCache.refetchQueries(
      query => query.queryKey[0] === 'todos' && query.queryKey[1]?.version >= 10
    )
  },
})

mutate(todo)

// The query below will be refetched when the mutation above succeeds
const todoListQuery = useQuery(['todos', { version: 20 }], fetchTodoList)
// The query below will be refetched when the mutation above succeeds
const todoListQuery = useQuery(['todos', { version: 10 }], fetchTodoList)
// However, the following query below will NOT be refetched
const todoListQuery = useQuery(['todos', { version: 5 }], fetchTodoList)
```

If you prefer that the promise returned from `mutate()` only resolves **after** the `onSuccess` callback, you can return a promise in the `onSuccess` callback:

```js
const [mutate] = useMutation(addTodo, {
  onSuccess: () =>
    // return a promise!
    queryCache.refetchQueries(
      query => query.queryKey[0] === 'todos' && query.queryKey[1]?.version >= 10
    ),
})

const run = async () => {
  try {
    await mutate(todo)
    console.log('I will only log after onSuccess is done!')
  } catch {}
}
```

If you would like to refetch queries on error or even regardless of a mutation's success or error, you can use the `onError` or `onSettled` callbacks:

```js
const [mutate] = useMutation(addTodo, {
  onError: error => {
    // Refetch queries or more...
  },
  onSettled: (data, error) => {
    // Refetch queries or more...
  },
})

mutate(todo)
```

You might find that you want to **add on** to some of the `useMutation`'s options at the time of calling `mutate`. To do that, you can provide any of the same options to the `mutate` function after your mutation variable. Supported option overrides include:

- `onSuccess` - Will be fired before the `useMutation`-level `onSuccess` handler
- `onError` - Will be fired before the `useMutation`-level `onError` handler
- `onSettled` - Will be fired before the `useMutation`-level `onSettled` handler
- `throwOnError`

```js
const [mutate] = useMutation(addTodo, {
  onSuccess: (data, mutationVariables) => {
    // I will fire second
  },
  onSettled: (data, error, mutationVariables) => {
    // I will fire second
  },
  onError: (error, mutationVariables) => {
    // I will fire second
  },
})

mutate(todo, {
  onSuccess: (data, mutationVariables) => {
    // I will fire first!
  },
  onSettled: (data, error, mutationVariables) => {
    // I will fire first!
  },
  onError: (error, mutationVariables) => {
    // I will fire first!
  },
  throwOnError: true,
})
```

## Query Updates from Mutations

When dealing with mutations that **update** objects on the server, it's common for the new object to be automatically returned in the response of the mutation. Instead of refetching any queries for that item and wasting a network call for data we already have, we can take advantage of the object returned by the mutation function and update the existing query with the new data immediately using the [Query Cache's `setQueryData`](#querycachesetquerydata) method:

```js
const [mutate] = useMutation(editTodo, {
  onSuccess: data => queryCache.setQueryData(['todo', { id: 5 }], data),
})

mutate({
  id: 5,
  name: 'Do the laundry',
})

// The query below will be updated with the response from the
// successful mutation
const { status, data, error } = useQuery(['todo', { id: 5 }], fetchTodoByID)
```

You might want to tight the `onSuccess` logic into a reusable mutation, for that you can
create a custom hook like this:

```js
const useMutateTodo = () => {
  return useMutate(editTodo, {
    // Notice the second argument is the variables object that the `mutate` function receives
    onSuccess: (data, variables) => {
      queryCache.setQueryData(['todo', { id: variables.id }], data)
    },
  })
}
```

## Resetting Mutation State

It's sometimes the case that you need to clear the `error` or `data` of a mutation request. To do this, you can use the `reset` function to handle this:

```js
const CreateTodo = () => {
  const [title, setTitle] = useState('')
  const [mutate, { error, reset }] = useMutation(createTodo)

  const onCreateTodo = async e => {
    e.preventDefault()
    await mutate({ title })
  }

  return (
    <form onSubmit={onCreateTodo}>
      {error && <h5 onClick={() => reset()}>{error}</h5>}
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

## Manually or Optimistically Setting Query Data

In rare circumstances, you may want to manually update a query's response with a custom value. To do this, you can again use the [Query Cache's `setQueryData`](#querycachesetquerydata) method:

> **It's important to understand** that when you manually or optimistically update a query's data value, the potential that you display out-of-sync data to your users is very high. It's recommended that you only do this if you plan to refetch the query very soon or perform a mutation to "commit" your manual changes (and also roll back your eager update if the refetch or mutation fails).

```js
// Full replacement
queryCache.setQueryData(['todo', { id: 5 }], newTodo)

// or functional update
queryCache.setQueryData(['todo', { id: 5 }], previous => ({
  ...previous,
  type: 'done',
}))
```

## Optimistic Updates with Automatic Rollback for Failed Mutations

When you optimistically update your state before performing a mutation, there is a non-zero chance that the mutation will fail. In most cases, you can just trigger a refetch for your optimistic queries to revert them to their true server state. In some circumstances though, refetching may not work correctly and the mutation error could represent some type of server issue that won't make it possible to refetch. In this event, you can instead choose to rollback your update.

To do this, `useMutation`'s `onMutate` handler option allows you to return a value that will later be passed to both `onError` and `onSettled` handlers as the last argument. In most cases, it is most useful to pass a rollback function.

### Updating a list of todos when adding a new todo

```js
useMutation(updateTodo, {
  // When mutate is called:
  onMutate: newTodo => {
    // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
    queryCache.cancelQueries('todos')

    // Snapshot the previous value
    const previousTodos = queryCache.getQueryData('todos')

    // Optimistically update to the new value
    queryCache.setQueryData('todos', old => [...old, newTodo])

    // Return the snapshotted value
    return () => queryCache.setQueryData('todos', previousTodos)
  },
  // If the mutation fails, use the value returned from onMutate to roll back
  onError: (err, newTodo, rollback) => rollback(),
  // Always refetch after error or success:
  onSettled: () => {
    queryCache.refetchQueries('todos')
  },
})
```

### Updating a single todo

```js
useMutation(updateTodo, {
  // When mutate is called:
  onMutate: newTodo => {
    // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
    queryCache.cancelQueries(['todos', newTodo.id])

    // Snapshot the previous value
    const previousTodo = queryCache.getQueryData(['todos', newTodo.id], newTodo)

    // Optimistically update to the new value
    queryCache.setQueryData(['todos', newTodo.id], newTodo)

    // Return a rollback function
    return () => queryCache.setQueryData(['todos', newTodo.id], previousTodo)
  },
  // If the mutation fails, use the rollback function we returned above
  onError: (err, newTodo, rollback) => rollback(),
  // Always refetch after error or success:
  onSettled: () => {
    queryCache.refetchQueries(['todos', newTodo.id])
  },
})
```

You can also use the `onSettled` function in place of the separate `onError` and `onSuccess` handlers if you wish:

```js
useMutation(updateTodo, {
  // ...
  onSettled: (newTodo, error, variables, rollback) => {
    if (error) {
      rollback()
    }
  },
})
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

# Window-Focus Refetching

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

## Custom Window Focus Event

In rare circumstances, you may want to manage your own window focus events that trigger React Query to revalidate. To do this, React Query provides a `setFocusHandler` function that supplies you the callback that should be fired when the window is focused and allows you to set up your own events. When calling `setFocusHandler`, the previously set handler is removed (which in most cases will be the default handler) and your new handler is used instead. For example, this is the default handler:

```js
setFocusHandler(handleFocus => {
  // Listen to visibillitychange and focus
  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('visibilitychange', handleFocus, false)
    window.addEventListener('focus', handleFocus, false)
  }

  return () => {
    // Be sure to unsubscribe if a new handler is set
    window.removeEventListener('visibilitychange', handleFocus)
    window.removeEventListener('focus', handleFocus)
  }
})
```

## Ignoring Iframe Focus Events

A great use-case for replacing the focus handler is that of iframe events. Iframes present problems with detecting window focus by both double-firing events and also firing false-positive events when focusing or using iframes within your app. If you experience this, you should use an event handler that ignores these events as much as possible. I recommend [this one](https://gist.github.com/tannerlinsley/1d3a2122332107fcd8c9cc379be10d88)! It can be set up in the following way:

```js
import { setFocusHandler } from 'react-query'
import onWindowFocus from './onWindowFocus' // The gist above

setFocusHandler(onWindowFocus) // Boom!
```

# Custom Query Key Serializers (Experimental)

> **WARNING:** This is an advanced and experimental feature. There be dragons here. Do not change the Query Key Serializer unless you know what you are doing and are fine with encountering edge cases in React Query's API

<details>
<summary>Show Me The Dragons!</summary>

If you absolutely despise the default query key implementation, then please file an issue in this repo first. If you still believe you need something different, then you can choose to replace the default query key serializer with your own by using the `ReactQueryConfigProvider` hook's `queryKeySerializerFn` option:

```js
const queryConfig = {
  queryKeySerializerFn: queryKey => {
    // Your custom logic here...

    // Make sure object keys are sorted and all values are
    // serializable
    const queryFnArgs = getQueryArgs(queryKey)

    // Hash the query key args to get a string
    const queryHash = hash(queryFnArgs)

    // Return both the queryHash and normalizedQueryHash as a tuple
    return [queryHash, queryFnArgs]
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
  - It may be a string or an array of serializable values
  - If a string is passed, it must be wrapped in an array when returned as the `queryFnArgs`
- `queryHash: string`
  - This must be a unique `string` representing the entire query key.
  - It must be stable and deterministic and should not change if things like the order of variables are changed or shuffled.
- `queryFnArgs: Array<any>`
  - This array will be spread into the query function arguments and should be the same format as the queryKey but be deterministically stable and should not change structure if the variables of the query stay the same, but change order within array position.

> An additional `stableStringify` utility is also exported to help with stringifying objects to have sorted keys.

### URL Query Key Serializer Example

The example below shows how to build your own serializer for use with URLs and use it with React Query:

```js
import { ReactQueryConfigProvider, stableStringify } from 'react-query'

function urlQueryKeySerializer(queryKey) {
  // Deconstruct the url
  let [url, params = ''] = queryKey.split('?')

  // Remove trailing slashes from the url to make an ID
  url = url.replace(/\/{1,}$/, '')

  // Build the searchQuery object
  params.split('&').filter(Boolean)

  // If there are search params, return a different key
  if (Object.keys(params).length) {
    let searchQuery = {}

    params.forEach(param => {
      const [key, value] = param.split('=')
      searchQuery[key] = value
    })

    // Use stableStringify to turn searchQuery into a stable string
    const searchQueryHash = stableStringify(searchQuery)

    // Get the stable json object for the normalized key
    searchQuery = JSON.parse(searchQueryHash)

    return [`${url}_${searchQueryHash}`, [url, searchQuery]]
  }

  return [url, [url]]
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
  return useQuery(url, (url, params) =>
    axios
      .get(url, {
        params,
      })
      .then(res => res.data)
  )
}

// Use it in your app!

function Todos() {
  const todosQuery = useUrlQuery(`/todos`)
}

function FilteredTodos({ status = 'pending' }) {
  const todosQuery = useUrlQuery(`/todos?status=pending`)
}

function Todo({ id }) {
  const todoQuery = useUrlQuery(`/todos/${id}`)
}

refetchQuery('/todos')
refetchQuery('/todos?status=pending')
refetchQuery('/todos/5')
```

### Function Query Key Serializer Example

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
refetchQuery([getTodos, { type: 'pending' }])
refetchQuery([getTodo, { id: 5 }])
```

</details>

# React Query Devtools

React query has dedicated devtools! Visit the [React Query Devtools Github Repo](https://github.com/tannerlinsley/react-query-devtools) for information on how to install and use them!

To see a demo, [check out the Sandbox example!](https://codesandbox.io/s/github/tannerlinsley/react-query/tree/master/examples/playground)

[![React Query Header](https://github.com/tannerlinsley/react-query-devtools/raw/master/media/header.png)](https://github.com/tannerlinsley/react-query-devtools)

# API

## `useQuery`

```js
const {
  status,
  data,
  error,
  isFetching,
  failureCount,
  refetch,
} = useQuery(queryKey, [, queryVariables], queryFn, {
  manual,
  retry,
  retryDelay,
  staleTime
  cacheTime,
  refetchInterval,
  refetchIntervalInBackground,
  refetchOnWindowFocus,
  onSuccess,
  onError,
  onSettled,
  suspense,
  initialData,
  refetchOnMount,
  queryFnParamsFilter
})

// or using the object syntax

const queryInfo = useQuery({
  queryKey,
  queryFn,
  variables,
  config
})
```

### Options

- `queryKey: String | [String, Variables: Object] | falsy | Function => queryKey`
  - **Required**
  - The query key to use for this query.
  - If a string is passed, it will be used as the query key.
  - If a `[String, Object]` tuple is passed, they will be serialized into a stable query key. See [Query Keys](#query-keys) for more information.
  - If a falsy value is passed, the query will be disabled and not run automatically.
  - If a function is passed, it should resolve to any other valid query key type. If the function throws, the query will be disabled and not run automatically.
  - The query will automatically update when this key changes (if the key is not falsy and if `manual` is not set to `true`).
  - `Variables: Object`
    - If a tuple with variables is passed, this object should be **serializable**.
    - Nested arrays and objects are supported.
    - The order of object keys is sorted to be stable before being serialized into the query key.
- `queryFn: Function(variables) => Promise(data/error)`
  - **Required**
  - The function that the query will use to request data.
  - Receives the following variables in the order that they are provided:
    - Query Key Variables
    - Optional Query Variables passed after the key and before the query function
  - Must return a promise that will either resolves data or throws an error.
- `manual: Boolean`
  - Set this to `true` to disable automatic refetching when the query mounts or changes query keys.
  - To refetch the query, use the `refetch` method returned from the `useQuery` instance.
- `retry: Boolean | Int | Function(failureCount, error) => shouldRetry | Boolean`
  - If `false`, failed queries will not retry by default.
  - If `true`, failed queries will retry infinitely.
  - If set to an `Int`, e.g. `3`, failed queries will retry until the failed query count meets that number.
- `retryDelay: Function(retryAttempt: Int) => Int`
  - This function receives a `retryAttempt` integer and returns the delay to apply before the next attempt in milliseconds.
  - A function like `attempt => Math.min(attempt > 1 ? 2 ** attempt * 1000 : 1000, 30 * 1000)` applies exponential backoff.
  - A function like `attempt => attempt * 1000` applies linear backoff.
- `staleTime: Int | Infinity`
  - The time in milliseconds that cache data remains fresh. After a successful cache update, that cache data will become stale after this duration.
  - If set to `Infinity`, query will never go stale
- `cacheTime: Int | Infinity`
  - The time in milliseconds that unused/inactive cache data remains in memory. When a query's cache becomes unused or inactive, that cache data will be garbage collected after this duration.
  - If set to `Infinity`, will disable garbage collection
- `refetchInterval: false | Integer`
  - Optional
  - If set to a number, all queries will continuously refetch at this frequency in milliseconds
- `refetchIntervalInBackground: Boolean`
  - Optional
  - If set to `true`, queries that are set to continuously refetch with a `refetchInterval` will continue to refetch while their tab/window is in the background
- `refetchOnWindowFocus: Boolean`
  - Optional
  - Set this to `false` to disable automatic refetching on window focus (useful, when `refetchAllOnWindowFocus` is set to `true`).
  - Set this to `true` to enable automatic refetching on window focus (useful, when `refetchAllOnWindowFocus` is set to `false`.
- `onSuccess: Function(data) => data`
  - Optional
  - This function will fire any time the query successfully fetches new data.
- `onError: Function(err) => void`
  - Optional
  - This function will fire if the query encounters an error and will be passed the error.
- `onSettled: Function(data, error) => data`
  - Optional
  - This function will fire any time the query is either successfully fetched or errors and be passed either the data or error
- `suspense: Boolean`
  - Optional
  - Set this to `true` to enable suspense mode.
  - When `true`, `useQuery` will suspend when `status === 'loading'`
  - When `true`, `useQuery` will throw runtime errors when `status === 'error'`
- `initialData: any | Function() => any`
  - Optional
  - If set, this value will be used as the initial data for the query cache (as long as the query hasn't been created or cached yet)
  - If set to a function, the function will be called **once** during the shared/root query initialization, and be expected to synchronously return the initialData
- `refetchOnMount: Boolean`
  - Optional
  - Defaults to `true`
  - If set to `false`, will disable additional instances of a query to trigger background refetches
- `queryFnParamsFilter: Function(args) => filteredArgs`
  - Optional
  - This function will filter the params that get passed to `queryFn`.
  - For example, you can filter out the first query key from the params by using `queryFnParamsFilter: args => args.slice(1)`.

### Returns

- `status: String`
  - Will be:
    - `loading` if the query is in an initial loading state. This means there is no cached data and the query is currently fetching, eg `isFetching === true`)
    - `error` if the query attempt resulted in an error. The corresponding `error` property has the error received from the attempted fetch
    - `success` if the query has received a response with no errors and is ready to display its data. The corresponding `data` property on the query is the data received from the successful fetch or if the query is in `manual` mode and has not been fetched yet `data` is the first `initialData` supplied to the query on initialization.
- `data: Any`
  - Defaults to `undefined`.
  - The last successfully resolved data for the query.
- `error: null | Error`
  - Defaults to `null`
  - The error object for the query, if an error was thrown.
- `isFetching: Boolean`
  - Defaults to `true` so long as `manual` is set to `false`
  - Will be `true` if the query is currently fetching, including background fetching.
- `failureCount: Integer`
  - The failure count for the query.
  - Incremented every time the query fails.
  - Reset to `0` when the query succeeds.
- `refetch: Function({ force, throwOnError }) => void`
  - A function to manually refetch the query if it is stale.
  - To bypass the stale check, you can pass the `force: true` option and refetch it regardless of it's freshness
  - If the query errors, the error will only be logged. If you want an error to be thrown, pass the `throwOnError: true` option

## `usePaginatedQuery`

```js
const {
  status,
  resolvedData,
  latestData,
  error,
  isFetching,
  failureCount,
  refetch,
} = usePaginatedQuery(queryKey, [, queryVariables], queryFn, {
  manual,
  retry,
  retryDelay,
  staleTime
  cacheTime,
  refetchInterval,
  refetchIntervalInBackground,
  refetchOnWindowFocus,
  onSuccess,
  onError,
  suspense,
  initialData,
  refetchOnMount
})
```

### Options

- `queryKey: String | [String, Variables: Object] | falsy | Function => queryKey`
  - **Required**
  - The query key to use for this query.
  - If a string is passed, it will be used as the query key.
  - If a `[String, Object]` tuple is passed, they will be serialized into a stable query key. See [Query Keys](#query-keys) for more information.
  - If a falsy value is passed, the query will be disabled and not run automatically.
  - If a function is passed, it should resolve to any other valid query key type. If the function throws, the query will be disabled and not run automatically.
  - The query will automatically update when this key changes (if the key is not falsy and if `manual` is not set to `true`).
  - `Variables: Object`
    - If a tuple with variables is passed, this object should be **serializable**.
    - Nested arrays and objects are supported.
    - The order of object keys is sorted to be stable before being serialized into the query key.
- `queryFn: Function(variables) => Promise(data/error)`
  - **Required**
  - The function that the query will use to request data.
  - Receives the following variables in the order that they are provided:
    - Query Key Variables
    - Optional Query Variables passed after the key and before the query function
  - Must return a promise that will either resolves data or throws an error.
- `manual: Boolean`
  - Set this to `true` to disable automatic refetching when the query mounts or changes query keys.
  - To refetch the query, use the `refetch` method returned from the `useQuery` instance.
- `retry: Boolean | Int | Function(failureCount, error) => shouldRetry | Boolean`
  - If `false`, failed queries will not retry by default.
  - If `true`, failed queries will retry infinitely.
  - If set to an `Int`, e.g. `3`, failed queries will retry until the failed query count meets that number.
- `retryDelay: Function(retryAttempt: Int) => Int`
  - This function receives a `retryAttempt` integer and returns the delay to apply before the next attempt in milliseconds.
  - A function like `attempt => Math.min(attempt > 1 ? 2 ** attempt * 1000 : 1000, 30 * 1000)` applies exponential backoff.
  - A function like `attempt => attempt * 1000` applies linear backoff.
- `staleTime: Int | Infinity`
  - The time in milliseconds that cache data remains fresh. After a successful cache update, that cache data will become stale after this duration.
  - If set to `Infinity`, query will never go stale
- `cacheTime: Int | Infinity`
  - The time in milliseconds that unused/inactive cache data remains in memory. When a query's cache becomes unused or inactive, that cache data will be garbage collected after this duration.
  - If set to `Infinity`, will disable garbage collection
- `refetchInterval: false | Integer`
  - Optional
  - If set to a number, all queries will continuously refetch at this frequency in milliseconds
- `refetchIntervalInBackground: Boolean`
  - Optional
  - If set to `true`, queries that are set to continuously refetch with a `refetchInterval` will continue to refetch while their tab/window is in the background
- `refetchOnWindowFocus: Boolean`
  - Optional
  - Set this to `false` to disable automatic refetching on window focus (useful, when `refetchAllOnWindowFocus` is set to `true`).
  - Set this to `true` to enable automatic refetching on window focus (useful, when `refetchAllOnWindowFocus` is set to `false`.
- `onSuccess: Function(data) => data`
  - Optional
  - This function will fire any time the query successfully fetches new data and will be passed the new data as a parameter
- `onError: Function(error) => void`
  - Optional
  - This function will fire if the query encounters an error and will be passed the error.
- `onSettled: Function(data, error) => data`
  - Optional
  - This function will fire any time the query is either successfully fetched or errors and be passed either the data or error
- `suspense: Boolean`
  - Optional
  - Set this to `true` to enable suspense mode.
  - When `true`, `useQuery` will suspend when `status === 'loading'`
  - When `true`, `useQuery` will throw runtime errors when `status === 'error'`
- `initialData: any`
  - Optional
  - If set, this value will be used as the initial data for the query cache (as long as the query hasn't been created or cached yet)
- `refetchOnMount: Boolean`
  - Optional
  - Defaults to `true`
  - If set to `false`, will disable additional instances of a query to trigger background refetches

### Returns

- `status: String`
  - Will be:
    - `loading` if the query is in an initial loading state. This means there is no cached data and the query is currently fetching, eg `isFetching === true`)
    - `error` if the query attempt resulted in an error. The corresponding `error` property has the error received from the attempted fetch
    - `success` if the query has received a response with no errors and is ready to display its data. The corresponding `data` property on the query is the data received from the successful fetch or if the query is in `manual` mode and has not been fetched yet `data` is the first `initialData` supplied to the query on initialization.
- `resolvedData: Any`
  - Defaults to `undefined`.
  - The last successfully resolved data for the query.
  - When fetching based on a new query key, the value will resolve to the last known successful value, regardless of query key
- `latestData: Any`
  - Defaults to `undefined`.
  - The actual data object for this query and its specific query key
  - When fetching an uncached query, this value will be `undefined`
- `error: null | Error`
  - Defaults to `null`
  - The error object for the query, if an error was thrown.
- `isFetching: Boolean`
  - Defaults to `true` so long as `manual` is set to `false`
  - Will be `true` if the query is currently fetching, including background fetching.
- `failureCount: Integer`
  - The failure count for the query.
  - Incremented every time the query fails.
  - Reset to `0` when the query succeeds.
- `refetch: Function({ force, throwOnError }) => void`
  - A function to manually refetch the query if it is stale.
  - To bypass the stale check, you can pass the `force: true` option and refetch it regardless of it's freshness
  - If the query errors, the error will only be logged. If you want an error to be thrown, pass the `throwOnError: true` option

## `useInfiniteQuery`

```js

const queryFn = (...queryKey, fetchMoreVariable) => Promise

const {
  status,
  data,
  error,
  isFetching,
  failureCount,
  refetch,
} = useInfiniteQuery(queryKey, [, queryVariables], queryFn, {
  getFetchMore: (lastPage, allPages) => fetchMoreVariable
  manual,
  retry,
  retryDelay,
  staleTime
  cacheTime,
  refetchInterval,
  refetchIntervalInBackground,
  refetchOnWindowFocus,
  onSuccess,
  onError,
  suspense,
  initialData,
  refetchOnMount
})
```

### Options

- `queryKey: String | [String, Variables: Object] | falsy | Function => queryKey`
  - **Required**
  - The query key to use for this query.
  - If a string is passed, it will be used as the query key.
  - If a `[String, Object]` tuple is passed, they will be serialized into a stable query key. See [Query Keys](#query-keys) for more information.
  - If a falsy value is passed, the query will be disabled and not run automatically.
  - If a function is passed, it should resolve to any other valid query key type. If the function throws, the query will be disabled and not run automatically.
  - The query will automatically update when this key changes (if the key is not falsy and if `manual` is not set to `true`).
  - `Variables: Object`
    - If a tuple with variables is passed, this object should be **serializable**.
    - Nested arrays and objects are supported.
    - The order of object keys is sorted to be stable before being serialized into the query key.
- `queryFn: Function(variables) => Promise(data/error)`
  - **Required**
  - The function that the query will use to request data.
  - Receives the following variables in the order that they are provided:
    - Query Key Variables
    - Optional Query Variables passed after the key and before the query function
    - Optionally, the single variable returned from the `getFetchMore` function, used to fetch the next page
  - Must return a promise that will either resolves data or throws an error.
- `getFetchMore: Function(lastPage, allPages) => fetchMoreVariable | Boolean`
  - When new data is received for this query, this function receives both the last page of the infinite list of data and the full array of all pages.
  - It should return a **single variable** that will be passed as the last optional parameter to your query function
- `manual: Boolean`
  - Set this to `true` to disable automatic refetching when the query mounts or changes query keys.
  - To refetch the query, use the `refetch` method returned from the `useQuery` instance.
- `retry: Boolean | Int | Function(failureCount, error) => shouldRetry | Boolean`
  - If `false`, failed queries will not retry by default.
  - If `true`, failed queries will retry infinitely.
  - If set to an `Int`, e.g. `3`, failed queries will retry until the failed query count meets that number.
- `retryDelay: Function(retryAttempt: Int) => Int`
  - This function receives a `retryAttempt` integer and returns the delay to apply before the next attempt in milliseconds.
  - A function like `attempt => Math.min(attempt > 1 ? 2 ** attempt * 1000 : 1000, 30 * 1000)` applies exponential backoff.
  - A function like `attempt => attempt * 1000` applies linear backoff.
- `staleTime: Int | Infinity`
  - The time in milliseconds that cache data remains fresh. After a successful cache update, that cache data will become stale after this duration.
  - If set to `Infinity`, query will never go stale
- `cacheTime: Int | Infinity`
  - The time in milliseconds that unused/inactive cache data remains in memory. When a query's cache becomes unused or inactive, that cache data will be garbage collected after this duration.
  - If set to `Infinity`, will disable garbage collection
- `refetchInterval: false | Integer`
  - Optional
  - If set to a number, all queries will continuously refetch at this frequency in milliseconds
- `refetchIntervalInBackground: Boolean`
  - Optional
  - If set to `true`, queries that are set to continuously refetch with a `refetchInterval` will continue to refetch while their tab/window is in the background
- `refetchOnWindowFocus: Boolean`
  - Optional
  - Set this to `false` to disable automatic refetching on window focus (useful, when `refetchAllOnWindowFocus` is set to `true`).
  - Set this to `true` to enable automatic refetching on window focus (useful, when `refetchAllOnWindowFocus` is set to `false`.
- `onSuccess: Function(data) => data`
  - Optional
  - This function will fire any time the query successfully fetches new data.
- `onError: Function(err) => void`
  - Optional
  - This function will fire if the query encounters an error and will be passed the error.
- `onSettled: Function(data, error) => data`
  - Optional
  - This function will fire any time the query is either successfully fetched or errors and be passed either the data or error
- `suspense: Boolean`
  - Optional
  - Set this to `true` to enable suspense mode.
  - When `true`, `useQuery` will suspend when `status === 'loading'`
  - When `true`, `useQuery` will throw runtime errors when `status === 'error'`
- `initialData: any`
  - Optional
  - If set, this value will be used as the initial data for the query cache (as long as the query hasn't been created or cached yet)
- `refetchOnMount: Boolean`
  - Optional
  - Defaults to `true`
  - If set to `false`, will disable additional instances of a query to trigger background refetches

### Returns

- `status: String`
  - Will be:
    - `loading` if the query is in an initial loading state. This means there is no cached data and the query is currently fetching, eg `isFetching === true`)
    - `error` if the query attempt resulted in an error. The corresponding `error` property has the error received from the attempted fetch
    - `success` if the query has received a response with no errors and is ready to display its data. The corresponding `data` property on the query is the data received from the successful fetch or if the query is in `manual` mode and has not been fetched yet `data` is the first `initialData` supplied to the query on initialization.
- `data: Any`
  - Defaults to `[]`.
  - This array contains each "page" of data that has been requested
- `error: null | Error`
  - Defaults to `null`
  - The error object for the query, if an error was thrown.
- `isFetching: Boolean`
  - Defaults to `true` so long as `manual` is set to `false`
  - Will be `true` if the query is currently fetching, including background fetching.
- `isFetchingMore: Boolean`
  - If using `paginated` mode, this will be `true` when fetching more results using the `fetchMore` function.
- `failureCount: Integer`
  - The failure count for the query.
  - Incremented every time the query fails.
  - Reset to `0` when the query succeeds.
- `refetch: Function({ force, throwOnError }) => void`
  - A function to manually refetch the query if it is stale.
  - To bypass the stale check, you can pass the `force: true` option and refetch it regardless of it's freshness
  - If the query errors, the error will only be logged. If you want an error to be thrown, pass the `throwOnError: true` option
- `fetchMore: Function(fetchMoreVariableOverride) => Promise`
  - This function allows you to fetch the next "page" of results.
  - `fetchMoreVariableOverride` allows you to optionally override the fetch more variable returned from your `getCanFetchMore` option to your query function to retrieve the next page of results.
- `canFetchMore: Boolean`
  - If using `paginated` mode, this will be `true` if there is more data to be fetched (known via the required `getFetchMore` option function).

## `useMutation`

```js
const [mutate, { status, data, error, reset }] = useMutation(mutationFn, {
  onMutate
  onSuccess,
  onError,
  onSettled,
  throwOnError,
  useErrorBoundary,
  { ...selectedUseQueryOptions },
})

const promise = mutate(variables, {
  onSuccess,
  onSettled,
  onError,
  throwOnError,
})
```

### Options

- `mutationFn: Function(variables) => Promise`
  - **Required**
  - A function that performs an asynchronous task and returns a promise.
  - `variables` is an object that `mutate` will pass to your `mutationFn`
- `onMutate: Function(variables) => Promise | snapshotValue`
  - Optional
  - This function will fire before the mutation function is fired and is passed the same variables the mutation function would receive
  - Useful to perform optimistic updates to a resource in hopes that the mutation succeeds
  - The value returned from this function will be passed to both the `onError` and `onSettled` functions and can be useful for rolling back optimistic updates in the event of a mutation failure.
- `onSuccess: Function(data, variables) => Promise | undefined`
  - Optional
  - This function will fire when the mutation is successful and will be passed the mutation's result.
  - Fires after the `mutate`-level `onSuccess` handler (if it is defined)
  - If a promise is returned, it will be awaited and resolved before proceeding
- `onError: Function(err, variables, onMutateValue) => Promise | undefined`
  - Optional
  - This function will fire if the mutation encounters an error and will be passed the error.
  - Fires after the `mutate`-level `onError` handerl (if it is defined)
  - If a promise is returned, it will be awaited and resolved before proceeding
- `onSettled: Function(data, error, variables, onMutateValue) => Promise | undefined`
  - Optional
  - This function will fire when the mutation is either successfully fetched or encounters an error and be passed either the data or error
  - Fires after the `mutate`-level `onSettled` handerl (if it is defined)
  - If a promise is returned, it will be awaited and resolved before proceeding
- `throwOnError`
  - Defaults to `false`
  - Set this to `true` if failed mutations should re-throw errors from the mutation function to the `mutate` function.
- `useErrorBoundary`
  - Defaults to the global query config's `useErrorBoundary` value, which is `false`
  - Set this to true if you want mutation errors to be thrown in the render phase and propagate to the nearest error boundary
- `selectedUseQueryOptions`
  - _Selected_ options of `useQuery` are also applicable here. E.g. `retry` and `retryDelay` can be used as described in the [`useQuery` section](#usequery). _Documentation of these options will be improved in the future._

### Returns

- `mutate: Function(variables, { onSuccess, onSettled, onError, throwOnError }) => Promise`
  - The mutation function you can call with variables to trigger the mutation and optionally override the original mutation options.
  - `variables: any`
    - Optional
    - The variables object to pass to the `mutationFn`.
  - Remaining options extend the same options described above in the `useMutation` hook.
  - Lifecycle callbacks defined here will fire **before** those of the same type defined in the `useMutation`-level options.
- `status: String`
  - Will be:
    - `idle` initial status prior to the mutation function executing.
    - `loading` if the mutation is currently executing.
    - `error` if the last mutation attempt resulted in an error.
    - `success` if the last mutation attempt was successful.
- `data: undefined | Any`
  - Defaults to `undefined`
  - The last successfully resolved data for the query.
- `error: null | Error`
  - The error object for the query, if an error was encountered.
- `promise: Promise`
  - The promise that is returned by the `mutationFn`.

## `queryCache`

The `queryCache` instance is the backbone of React Query that manages all of the state, caching, lifecycle and magic of every query. It supports relatively unrestricted, but safe, access to manipulate query's as you need. Its available properties and methods are:

- [`prefetchQuery`](#querycacheprefetchquery)
- [`getQueryData`](#querycachegetquerydata)
- [`setQueryData`](#querycachesetquerydata)
- [`refetchQueries`](#querycacherefetchqueries)
- [`cancelQueries`](#querycachecancelqueries)
- [`removeQueries`](#querycacheremovequeries)
- [`getQueries`](#querycachegetqueries)
- [`getQuery`](#querycachegetquery)
- [`subscribe`](#querycachesubscribe)
- [`isFetching`](#querycacheisfetching)
- [`clear`](#querycacheclear)

## `queryCache.prefetchQuery`

`prefetchQuery` is an asynchronous function that can be used to fetch and cache a query response before it is needed or fetched with `useQuery`.

- If the query already exists and is fresh (not stale), the call will resolve immediately and no action will be taken.
  - If you want to force the query to prefetch again, you can pass the `force: true` option in the query config
- If the query does not exist, it will be created and immediately be marked as stale. **If this created query is not utilized by a query hook in the `cacheTime` (defaults to 5 minutes), the query will be garbage collected**.

> The difference between using `prefetchQuery` and `setQueryData` is that `prefetchQuery` is async and will ensure that duplicate requests for this query are not created with `useQuery` instances for the same query are rendered while the data is fetching.

```js
import { queryCache } from 'react-query'

const data = await queryCache.prefetchQuery(queryKey, queryFn)
```

For convenience in syntax, you can also pass optional query variables to `prefetchQuery` just like you can `useQuery`:

```js
import { queryCache } from 'react-query'

const data = await queryCache.prefetchQuery(
  queryKey,
  queryVariables,
  queryFn,
  config
)
```

### Options

The options for `prefetchQuery` are exactly the same as those of [`useQuery`](#usequery) with the exception of:

- `config.throwOnError: Boolean`
  - Set this `true` if you want `prefetchQuery` to throw an error when it encounters errors.

### Returns

- `promise: Promise`
  - A promise is returned that will either immediately resolve with the query's cached response data, or resolve to the data returned by the fetch function. It **will not** throw an error if the fetch fails. This can be configured by setting the `throwOnError` option to `true`.

## `queryCache.getQueryData`

`getQueryData` is a synchronous function that can be used to get an existing query's cached data. If the query does not exist, `undefined` will be returned.

```js
import { queryCache } from 'react-query'

const data = queryCache.getQueryData(queryKey)
```

### Options

- `queryKey: QueryKey`
  - See [Query Keys](#query-keys) for more information on how to construct and use a query key

### Returns

- `data: any | undefined`
  - The data for the cached query, or `undefined` if the query does not exist.

## `queryCache.setQueryData`

`setQueryData` is a synchronous function that can be used to immediately update a query's cached data. If the query does not exist, it will be created and immediately be marked as stale. **If the query is not utilized by a query hook in the default `cacheTime` of 5 minutes, the query will be garbage collected**.

> The difference between using `setQueryData` and `prefetchQuery` is that `setQueryData` is sync and assumes that you already synchronously have the data available. If you need to fetch the data asynchronously, it's suggested that you either refetch the query key or use `prefetchQuery` to handle the asynchronous fetch.

```js
import { queryCache } from 'react-query'

queryCache.setQueryData(queryKey, updater)
```

### Options

- `queryKey: QueryKey`
  - See [Query Keys](#query-keys) for more information on how to construct and use a query key
- `updater: Any | Function(oldData) => newData`
  - If non-function is passed, the data will be updated to this value
  - If a function is passed, it will receive the old data value and be expected to return a new one.

### Using an updater value

```js
setQueryData(queryKey, newData)
```

### Using an updater function

For convenience in syntax, you can also pass an updater function which receives the current data value and returns the new one:

```js
setQueryData(queryKey, oldData => newData)
```

## `queryCache.refetchQueries`

The `refetchQueries` method can be used to refetch single or multiple queries in the cache based on their query keys or any other functionally accessible property/state of the query. By default, queries that are fresh (not stale) will not be refetched, but you can override this by passing the `force: true` option.

```js
import { queryCache } from 'react-query'

const queries = queryCache.refetchQueries(inclusiveQueryKeyOrPredicateFn, {
  exact,
  throwOnError,
  force,
})
```

### Options

- `queryKeyOrPredicateFn` can either be a [Query Key](#query-keys) or a `function`
  - `queryKey: QueryKey`
    - If a query key is passed, queries will be filtered to those where this query key is included in the existing query's query key. This means that if you passed a query key of `'todos'`, it would match queries with the `todos`, `['todos']`, and `['todos', 5]`. See [Query Keys](#query-keys) for more information.
  - `Function(query) => Boolean`
    - This predicate function will be called for every single query in the cache and be expected to return truthy for queries that are `found`.
    - The `exact` option has no effect with using a function
- `exact: Boolean`
  - If you don't want to search queries inclusively by query key, you can pass the `exact: true` option to return only the query with the exact query key you have passed. Remember to destructure it out of the array!
- `throwOnError: Boolean`
  - When set to `true`, this function will throw if any of the query refetch tasks fail.
- `force: Boolean`
  - When set to `true`, queries that match the refetch predicate will be refetched regardless if they are stale.

### Returns

This function returns a promise that will resolve when all of the queries are done being refetched. By default, it **will not** throw an error if any of those queries refetches fail, but this can be configured by setting the `throwOnError` option to `true`

## `queryCache.cancelQueries`

The `cancelQueries` method can be used to cancel outgoing queries based on their query keys or any other functionally accessible property/state of the query.

This is most useful when performing optimistic updates since you will likely need to cancel any outgoing query refetches so they don't clobber your optimistic update when they resolve.

```js
import { queryCache } from 'react-query'

const queries = queryCache.cancelQueries(queryKeyOrPredicateFn, {
  exact,
})
```

### Options

- `queryKeyOrPredicateFn` can either be a [Query Key](#query-keys) or a `function`
  - `queryKey`
    - If a query key is passed, queries will be filtered to those where this query key is included in the existing query's query key. This means that if you passed a query key of `'todos'`, it would match queries with the `todos`, `['todos']`, and `['todos', 5]`. See [Query Keys](#query-keys) for more information.
  - `Function(query) => Boolean`
    - This predicate function will be called for every single query in the cache and be expected to return truthy for queries that are `found`.
    - The `exact` option has no effect with using a function
- `exact: Boolean`
  - If you don't want to search queries inclusively by query key, you can pass the `exact: true` option to return only the query with the exact query key you have passed. Remember to destructure it out of the array!

### Returns

This function does not return anything

## `queryCache.removeQueries`

The `removeQueries` method can be used to remove queries from the cache based on their query keys or any other functionally accessible property/state of the query.

```js
import { queryCache } from 'react-query'

const queries = queryCache.removeQueries(queryKeyOrPredicateFn, {
  exact,
})
```

### Options

- `queryKeyOrPredicateFn` can either be a [Query Key](#query-keys) or a `function`
  - `queryKey`
    - If a query key is passed, queries will be filtered to those where this query key is included in the existing query's query key. This means that if you passed a query key of `'todos'`, it would match queries with the `todos`, `['todos']`, and `['todos', 5]`. See [Query Keys](#query-keys) for more information.
  - `Function(query) => Boolean`
    - This predicate function will be called for every single query in the cache and be expected to return truthy for queries that are `found`.
    - The `exact` option has no effect with using a function
- `exact: Boolean`
  - If you don't want to search queries inclusively by query key, you can pass the `exact: true` option to return only the query with the exact query key you have passed. Remember to destructure it out of the array!

### Returns

This function does not return anything

## `queryCache.getQuery`

`getQuery` is a slightly more advanced synchronous function that can be used to get an existing query object from the cache. This object not only contains **all** the state for the query, but all of the instances, and underlying guts of the query as well. If the query does not exist, `undefined` will be returned.

> Note: This is not typically needed for most applications, but can come in handy when needing more information about a query in rare scenarios (eg. Looking at the query.state.updatedAt timestamp to decide whether a query is fresh enough to be used as an initial value)

```js
import { queryCache } from 'react-query'

const query = queryCache.getQuery(queryKey)
```

### Options

- `queryKey: QueryKey`
  - See [Query Keys](#query-keys) for more information on how to construct and use a query key

### Returns

- `query: QueryObject`
  - The query object from the cache

## `queryCache.getQueries`

`getQueries` is even more advanced synchronous function that can be used to get existing query objects from the cache that partially match query key. If queries do not exist, empty array will be returned.

> Note: This is not typically needed for most applications, but can come in handy when needing more information about a query in rare scenarios

```js
import { queryCache } from 'react-query'

const queries = queryCache.getQueries(queryKey)
```

### Options

- `queryKey: QueryKey`
  - See [Query Keys](#query-keys) for more information on how to construct and use a query key

### Returns

- `queries: QueryObject[]`
  - Query objects from the cache

## `queryCache.isFetching`

This `isFetching` property is an `integer` representing how many queries, if any, in the cache are currently fetching (including background-fetching, loading new pages, or loading more infinite query results)

```js
import { queryCache } from 'react-query'

if (queryCache.isFetching) {
  console.log('At least one query is fetching!')
}
```

React Query also exports a handy [`useIsFetching`](#useisfetching) hook that will let you subscribe to this state in your components without creating a manual subscription to the query cache.

## `queryCache.subscribe`

The `subscribe` method can be used to subscribe to the query cache as a whole and be informed of safe/known updates to the cache like query states changing or queries being updated, added or removed

```js
import { queryCache } from 'react-query'

const callback = cache => {}

const unsubscribe = queryCache.subscribe(callback)
```

### Options

- `callback: Function(queryCache) => void`
  - This function will be called with the query cache any time it is updated via its tracked update mechanisms (eg, `query.setState`, `queryCache.removeQueries`, etc). Out of scope mutations to the queryCache are not encouraged and will not fire subscription callbacks

### Returns

- `unsubscribe: Function => void`
  - This function will unsubscribe the callback from the query cache.

## `queryCache.clear`

The `clear` method can be used to clear the queryCache entirely and start fresh.

```js
import { queryCache } from 'react-query'

queryCache.clear()
```

### Returns

- `queries: Array<Query>`
  - This will be an array containing the queries that were found.

## `useQueryCache`

The `useQueryCache` hook returns the current queryCache instance.

```js
import { useQueryCache } from 'react-query'

const queryCache = useQueryCache()
```

If you are using the `ReactQueryCacheProvider` to set a custom cache, you cannot simply import `{ queryCache }` any more. This hook will ensure you're getting the correct instance.

## `useIsFetching`

`useIsFetching` is an optional hook that returns the `number` of the queries that your application is loading or fetching in the background (useful for app-wide loading indicators).

```js
import { useIsFetching } from 'react-query'

const isFetching = useIsFetching()
```

### Returns

- `isFetching: Int`
  - Will be the `number` of the queries that your application is currently loading or fetching in the background.

## `ReactQueryConfigProvider`

`ReactQueryConfigProvider` is an optional provider component and can be used to define defaults for all instances of `useQuery` within it's sub-tree:

```js
import { ReactQueryConfigProvider } from 'react-query'

const queryConfig = {
  // Global
  suspense: false,
  useErrorBoundary: undefined, // Defaults to the value of `suspense` if not defined otherwise
  throwOnError: false,
  refetchAllOnWindowFocus: true,
  queryKeySerializerFn: queryKey => [queryHash, queryFnArgs],
  onMutate: () => {},
  onSuccess: () => {},
  onError: () => {},
  onSettled: () => {},

  // useQuery
  retry: 3,
  retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  staleTime: 0,
  cacheTime: 5 * 60 * 1000,
  refetchInterval: false,
  queryFnParamsFilter: args => filteredArgs,
  refetchOnMount: true,
  isDataEqual: (previous, next) => true, // or false
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
  - For non-global properties please see their usage in both the [`useQuery` hook](#usequery) and the [`useMutation` hook](#usemutation).

## `ReactQueryCacheProvider`

`ReactQueryCacheProvider` is an optional provider component for explicitly setting the query cache used by React Query. This is useful for creating component-level caches that are not completely global, as well as making truly isolated unit tests.

```js
import { ReactQueryCacheProvider, makeQueryCache } from 'react-query'

const queryCache = makeQueryCache()

function App() {
  return (
    <ReactQueryCacheProvider queryCache={queryCache}>
      ...
    </ReactQueryCacheProvider>
  )
}
```

### Options

- `queryCache: Object`
  - In instance of queryCache, you can use the `makeQueryCache` factory to create this.
  - If not provided, a new cache will be generated.

## `setConsole`

`setConsole` is an optional utility function that allows you to replace the `console` interface used to log errors. By default, the `window.console` object is used. If no global `console` object is found in the environment, nothing will be logged.

```js
import { setConsole } from 'react-query'
import { printLog, printWarn, printError } from 'custom-logger'

setConsole({
  log: printLog,
  warn: printWarn,
  error: printError,
})
```

### Options

- `console: Object`
  - Must implement the `log`, `warn`, and `error` methods.

# Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://tannerlinsley.com"><img src="https://avatars0.githubusercontent.com/u/5580297?v=4" width="100px;" alt=""/><br /><sub><b>Tanner Linsley</b></sub></a><br /><a href="https://github.com/tannerlinsley/react-query/commits?author=tannerlinsley" title="Code">💻</a> <a href="#ideas-tannerlinsley" title="Ideas, Planning, & Feedback">🤔</a> <a href="#example-tannerlinsley" title="Examples">💡</a> <a href="#maintenance-tannerlinsley" title="Maintenance">🚧</a> <a href="https://github.com/tannerlinsley/react-query/pulls?q=is%3Apr+reviewed-by%3Atannerlinsley" title="Reviewed Pull Requests">👀</a></td>
    <td align="center"><a href="http://cherniavskii.com"><img src="https://avatars2.githubusercontent.com/u/13808724?v=4" width="100px;" alt=""/><br /><sub><b>Andrew Cherniavskii</b></sub></a><br /><a href="https://github.com/tannerlinsley/react-query/commits?author=cherniavskii" title="Code">💻</a> <a href="https://github.com/tannerlinsley/react-query/issues?q=author%3Acherniavskii" title="Bug reports">🐛</a></td>
    <td align="center"><a href="http://twitter.com/tibotiber"><img src="https://avatars3.githubusercontent.com/u/5635553?v=4" width="100px;" alt=""/><br /><sub><b>Thibaut Tiberghien</b></sub></a><br /><a href="https://github.com/tannerlinsley/react-query/commits?author=tibotiber" title="Documentation">📖</a></td>
    <td align="center"><a href="https://github.com/gargroh"><img src="https://avatars3.githubusercontent.com/u/42495927?v=4" width="100px;" alt=""/><br /><sub><b>Rohit Garg</b></sub></a><br /><a href="#tool-gargroh" title="Tools">🔧</a></td>
  </tr>
</table>

<!-- markdownlint-enable -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!

<!-- Force Toggle -->
