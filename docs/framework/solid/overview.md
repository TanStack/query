---
id: overview
title: Overview
---

Solid Query is the official SolidJS adapter of TanStack Query that makes **fetching, caching, synchronizing and updating server state** in your web applications a breeze.

## Motivation

SolidJS has been gaining popularity as a fast, reactive, and declarative library for building user interfaces. It comes packed with a lot of features out of the box. Primitives like `createSignal`, `createStore` are great for managing client state. And, unlike other UI libraries, SolidJS has strong opinions about managing asynchronous data. The `createResource` API is a great primitive for handling server state in SolidJS apps. A `resource` is a special kind of signal that can be used to trigger `Suspense` boundaries when the data is in a loading state.

```tsx
import { createResource, ErrorBoundary, Suspense } from 'solid-js'
import { render } from 'solid-js/web'

function App() {
  const [repository] = createResource(async () => {
    const result = await fetch('https://api.github.com/repos/TanStack/query')
    if (!result.ok) throw new Error('Failed to fetch data')
    return result.json()
  })

  return (
    <div>
      <div>Static Content</div>
      {/* An error while fetching will be caught by the ErrorBoundary */}
      <ErrorBoundary fallback={<div>Something went wrong!</div>}>
        {/* Suspense will trigger a loading state while the data is being fetched */}
        <Suspense fallback={<div>Loading...</div>}>
          <div>{repository()?.updated_at}</div>
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}

const root = document.getElementById('root')

render(() => <App />, root!)
```

This is amazing! In a few lines of code, you can fetch data from an API and handle loading and error states. But, as your application grows in complexity, you will need more features to manage server state effectively. This is because **server state is totally different from client state**. For starters, server state:

- Is persisted remotely in a location you do not control or own
- Requires asynchronous APIs for fetching and updating
- Implies shared ownership and can be changed by other people without your knowledge
- Can potentially become "out of date" in your applications if you're not careful

Once you grasp the nature of server state in your application, **even more challenges will arise** as you go, for example:

- Caching... (possibly the hardest thing to do in programming)
- Deduping multiple requests for the same data into a single request
- Updating "out of date" data in the background
- Knowing when data is "out of date"
- Reflecting updates to data as quickly as possible
- Performance optimizations like pagination and lazy loading data
- Managing memory and garbage collection of server state
- Memoizing query results with structural sharing

This is where **Solid Query** comes in. The library wraps around `createResource` and provides a set of hooks and utilities to manage server state effectively. It works amazingly well **out-of-the-box, with zero-config, and can be customized** to your liking as your application grows.

On a more technical note, Solid Query will likely:

- Help you remove **many** lines of complicated and misunderstood code from your application and replace with just a handful of lines of Solid Query logic.
- Make your application more maintainable and easier to build new features without worrying about wiring up new server state data sources
- Have a direct impact on your end-users by making your application feel faster and more responsive than ever before.
- Potentially help you save on bandwidth and increase memory performance

## Enough talk, show me some code already!

In the example below, you can see Solid Query in its most basic and simple form being used to fetch the GitHub stats for the TanStack Query GitHub project itself:

```tsx
import { ErrorBoundary, Suspense } from 'solid-js'
import {
  useQuery,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/solid-query'

function App() {
  const repositoryQuery = useQuery(() => ({
    queryKey: ['TanStack Query'],
    queryFn: async () => {
      const result = await fetch('https://api.github.com/repos/TanStack/query')
      if (!result.ok) throw new Error('Failed to fetch data')
      return result.json()
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    throwOnError: true, // Throw an error if the query fails
  }))

  return (
    <div>
      <div>Static Content</div>
      {/* An error while fetching will be caught by the ErrorBoundary */}
      <ErrorBoundary fallback={<div>Something went wrong!</div>}>
        {/* Suspense will trigger a loading state while the data is being fetched */}
        <Suspense fallback={<div>Loading...</div>}>
          {/* 
            The `data` property on a query is a SolidJS resource  
            so it will work with Suspense and transitions out of the box! 
          */}
          <div>{repositoryQuery.data?.updated_at}</div>
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}

const root = document.getElementById('root')
const client = new QueryClient()

render(
  () => (
    <QueryClientProvider client={client}>
      <App />
    </QueryClientProvider>
  ),
  root!,
)
```

## Well, that seems like more lines of code to do the same thing?

Yes it is! But, these few lines of code unlock a whole new world of possibilities. In the example above, your query is cached for 5 minutes, meaning that if a new component mounts anywhere in your app that uses the same query within 5 minutes, it will not re-fetch the data but instead use the cached data. This is just one of the many features that Solid Query provides out of the box. Some other features include:

- **Automatic Refetching**: Queries automatically refetch in the background when they become "stale" (out of date according to the `staleTime` option)
- **Automatic Caching**: Queries are cached by default and shared across your application
- **Request Deduplication**: Multiple components can share the same query and make one request
- **Automatic Garbage Collection**: Queries are garbage collected when they are no longer needed
- **Window Focus Refetching**: Queries automatically refetch when the application comes back into focus
- **Pagination**: Built-in support for pagination
- **Request Cancellation**: Automatically cancels outdated or unwanted requests
- **Polling/Realtime**: It's easy to add polling or realtime updates to your queries with a simple `refetchInterval` option
- **SSR Support**: Solid Query works great with server-side rendering
- **Optimistic Updates**: Easily update your cache with optimistic updates
- **And much more...**
