---
id: ssr
title: Server Rendering & Hydration
---

In this guide you'll learn how to use Preact Query with server rendering.

See the guide on [Prefetching & Router Integration](./prefetching.md) for some background. You might also want to check out the [Performance & Request Waterfalls guide](./request-waterfalls.md) before that.

## Server Rendering & Preact Query

So what is server rendering anyway? The rest of this guide will assume you are familiar with the concept, but let's spend some time to look at how it relates to Preact Query. Server rendering is the act of generating the initial html on the server, so that the user has some content to look at as soon as the page loads. This can happen on demand when a page is requested (SSR). It can also happen ahead of time either because a previous request was cached, or at build time (SSG).

If you've read the [Performance & Request Waterfalls guide](./request-waterfalls.md), you might remember this:

```
1. |-> Markup (without content)
2.   |-> JS
3.     |-> Query
```

With a client rendered application, these are the minimum 3 server roundtrips you will need to make before getting any content on the screen for the user. One way of viewing server rendering is that it turns the above into this:

```
1. |-> Markup (with content AND initial data)
2.   |-> JS
```

As soon as **1.** is complete, the user can see the content and when **2.** finishes, the page is interactive and clickable. Because the markup also contains the initial data we need, step **3.** does not need to run on the client at all, at least until you want to revalidate the data for some reason.

This is all from the clients perspective. On the server, we need to **prefetch** that data before we generate/render the markup, we need to **dehydrate** that data into a serializable format we can embed in the markup, and on the client we need to **hydrate** that data into a Preact Query cache so we can avoid doing a new fetch on the client.

Read on to learn how to implement these three steps with Preact Query.

## A quick note on Suspense

This guide uses the regular `useQuery` API. While we don't necessarily recommend it, it is possible to replace this with `useSuspenseQuery` instead **as long as you always prefetch all your queries**. The upside is that you get to use `<Suspense>` for loading states on the client.

If you do forget to prefetch a query when you are using `useSuspenseQuery`, the consequences will depend on your setup. In some cases, the data will Suspend and get fetched on the server but never be hydrated to the client, where it will fetch again. In these cases you will get a markup hydration mismatch, because the server and the client tried to render different things.

## Initial setup

The first step of using Preact Query is always to create a `queryClient` and wrap the application in a `<QueryClientProvider>`. When doing server rendering, it's important to create the `queryClient` instance **inside of your app**, in Preact state (an instance ref works fine too). **This ensures that data is not shared between different users and requests**, while still only creating the `queryClient` once per component lifecycle.

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/preact-query'
import { useState } from 'preact/hooks'

// NEVER DO THIS ON THE SERVER:
// const queryClient = new QueryClient()
//
// Creating the queryClient at the module root level makes the cache shared
// between all requests and means _all_ data gets passed to _all_ users.
// Besides being bad for performance, this also leaks any sensitive data.
// (On the client this is fine, since there's only ever one visitor per page.)

export function App({ children }) {
  // Instead do this, which ensures each request has its own cache:
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // With SSR, we usually want to set some default staleTime
            // above 0 to avoid refetching immediately on the client
            staleTime: 60 * 1000,
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
```

## Get started fast with `initialData`

The quickest way to get started is to not involve Preact Query at all when it comes to prefetching and not use the `dehydrate`/`hydrate` APIs. What you do instead is passing the raw data in as the `initialData` option to `useQuery`:

```tsx
function Posts({ posts }) {
  const { data } = useQuery({
    queryKey: ['posts'],
    queryFn: getPosts,
    initialData: posts,
  })

  // ...
}
```

The setup is minimal and this can be a quick solution for some cases, but there are a **few tradeoffs to consider** when compared to the full approach:

- If you are calling `useQuery` in a component deeper down in the tree you need to pass the `initialData` down to that point
- If you are calling `useQuery` with the same query in multiple locations, passing `initialData` to only one of them can be brittle and break when your app changes. If you remove or move the component that has the `useQuery` with `initialData`, the more deeply nested `useQuery` might no longer have any data. Passing `initialData` to **all** queries that need it can also be cumbersome.
- There is no way to know at what time the query was fetched on the server, so `dataUpdatedAt` and determining if the query needs refetching is based on when the page loaded instead
- If there is already data in the cache for a query, `initialData` will never overwrite this data, **even if the new data is fresher than the old one**.

Setting up the full hydration solution is straightforward and does not have these drawbacks, this will be the focus for the rest of the documentation.

## Using the Hydration APIs

With just a little more setup, you can use a `queryClient` to prefetch queries during a server render pass, serialize that `queryClient` and send it down with the initial markup, then reuse it to hydrate the client render. This avoids the drawbacks above. At a general level these are the extra steps:

- On the server, create a `const queryClient = new QueryClient(options)`
- Do `await queryClient.query(...)` for each query you want to prefetch
  - You want to use `await Promise.all(...)` to fetch the queries in parallel when possible
  - It's fine to have queries that aren't prefetched. These wont be server rendered, instead they will be fetched on the client after the application is interactive. This can be great for content that are shown only after user interaction, or is far down on the page to avoid blocking more critical content.
- Call `dehydrate(queryClient)` and embed the result in the markup you send to the client, alongside the html produced by `renderToString`
- On the client, wrap your tree with `<HydrationBoundary state={dehydratedState}>`, where `dehydratedState` is parsed back out of the embedded markup

> An interesting detail is that there are actually _two_ `queryClient`s involved on the server: one that prefetches, and one that renders. The prefetching client fetches the queries and gets `dehydrate`d; its dehydrated state is then `hydrate`d into a fresh render client, which is the one you actually pass to `<QueryClientProvider>` for `renderToString`. On the client, a third `queryClient` is created and hydrated with the same dehydrated state via `<HydrationBoundary>`, so all three start from the same data and produce the same markup.

### Full example with `preact-render-to-string`

Server entry point:

```tsx
import { renderToString } from 'preact-render-to-string'
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
  dehydrate,
  hydrate,
  noop,
} from '@tanstack/preact-query'

function makeQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache(),
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 60 * 1000,
      },
    },
  })
}

export async function render(url) {
  // The prefetching client: only used to fetch and dehydrate
  const prefetchClient = makeQueryClient()

  await prefetchClient
    .query({
      queryKey: ['posts'],
      queryFn: getPosts,
    })
    .catch(noop)

  const dehydratedState = dehydrate(prefetchClient)

  // The render client: hydrated with the same state, used for renderToString
  const renderClient = makeQueryClient()
  hydrate(renderClient, dehydratedState)

  const appHtml = renderToString(
    <QueryClientProvider client={renderClient}>
      <App />
    </QueryClientProvider>,
  )

  // Embed both the markup and the dehydrated state in the html you send down.
  // Use a safe serializer here (see Serialization below), NOT JSON.stringify,
  // since raw JSON.stringify output can break out of the <script> tag:
  // e.g. `<div id="app">${appHtml}</div><script>window.__DEHYDRATED_STATE__ = ${serialize(dehydratedState)}</script>`
  return { appHtml, dehydratedState }
}
```

Client entry point:

```tsx
import { hydrate as preactHydrate } from 'preact'
import { useState } from 'preact/hooks'
import {
  HydrationBoundary,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/preact-query'

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 60 * 1000,
      },
    },
  })
}

function App({ dehydratedState }) {
  const [queryClient] = useState(() => makeQueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <HydrationBoundary state={dehydratedState}>
        <Posts />
      </HydrationBoundary>
    </QueryClientProvider>
  )
}

// Read back and deserialize whatever you embedded on the server,
// e.g. `window.__DEHYDRATED_STATE__`
preactHydrate(
  <App dehydratedState={window.__DEHYDRATED_STATE__} />,
  document.getElementById('app'),
)
```

Anywhere inside the tree:

```tsx
function Posts() {
  // This useQuery could just as well happen in some deeper child to <App>,
  // data will be available immediately either way
  const { data } = useQuery({ queryKey: ['posts'], queryFn: getPosts })

  // This query was not prefetched on the server and will not start
  // fetching until on the client, both patterns are fine to mix
  const { data: commentsData } = useQuery({
    queryKey: ['posts-comments'],
    queryFn: getComments,
  })

  // ...
}
```

## Prefetching dependent queries

Over in the Prefetching guide we learned how to [prefetch dependent queries](./prefetching.md#dependent-queries-code-splitting), but how do we do this on the server? Consider the following code, taken from the [Dependent Queries guide](./dependent-queries.md):

```tsx
// Get the user
const { data: user } = useQuery({
  queryKey: ['user', email],
  queryFn: getUserByEmail,
})

const userId = user?.id

// Then get the user's projects
const {
  status,
  fetchStatus,
  data: projects,
} = useQuery({
  queryKey: ['projects', userId],
  queryFn: getProjectsByUser,
  // The query will not execute until the userId exists
  enabled: !!userId,
})
```

How would we prefetch this so it can be server rendered? Here's an example:

```tsx
const queryClient = new QueryClient()

const user = await queryClient.query({
  queryKey: ['user', email],
  queryFn: getUserByEmail,
})

if (user?.id) {
  await queryClient.query({
    queryKey: ['projects', user.id],
    queryFn: getProjectsByUser,
  })
}

const dehydratedState = dehydrate(queryClient)
```

This can get more complex of course, but since prefetching just happens with plain JavaScript, you can use the full power of the language to build your logic. Make sure you prefetch all queries that you want to be server rendered.

## Error handling

Preact Query defaults to a graceful degradation strategy. This means:

- `dehydrate(...)` only includes successful queries, not failed ones
- We can intentionally ignore the returned promise from `void queryClient.query(...)` and add `.catch(noop)` to swallow any errors, so surrounding server code will not observe query errors

This will lead to any failed queries being retried on the client and that the server rendered output will include loading states instead of the full content.

While a good default, sometimes this is not what you want. When critical content is missing, you might want to respond with a 404 or 500 status code depending on the situation. For these cases, use `await queryClient.query(...)` without the noop catch, which will throw errors when it fails, letting you handle things in a suitable way.

```tsx
let result

try {
  result = await queryClient.query(...)
} catch (error) {
  // Handle the error in whatever way fits your server setup
}

// You might also want to check and handle any invalid `result` here
```

If you for some reason want to include failed queries in the dehydrated state to avoid retries, you can use the option `shouldDehydrateQuery` to override the default function and implement your own logic:

```tsx
dehydrate(queryClient, {
  shouldDehydrateQuery: (query) => {
    // This will include all queries, including failed ones,
    // but you can also implement your own logic by inspecting `query`
    return true
  },
})
```

## Serialization

The `dehydrate(queryClient)` result needs to be serialized so it can be embedded into the markup and transported to the client, then parsed back out before being passed to `<HydrationBoundary state={...}>`.

Your first instinct might be to use `JSON.stringify(dehydratedState)`, but because this doesn't escape things like `<script>alert('Oh no..')</script>` by default, this can easily lead to **XSS-vulnerabilities** in your application. Instead we recommend using a library like [Serialize JavaScript](https://github.com/yahoo/serialize-javascript) or [devalue](https://github.com/Rich-Harris/devalue) which are both safe against XSS injections out of the box.

By default, plain `JSON.stringify`/`JSON.parse` also do not support `undefined`, `Error`, `Date`, `Map`, `Set`, `BigInt`, `Infinity`, `NaN`, `-0`, regular expressions etc. This also means that you can not return any of these things from your queries unless your serializer supports them. If returning these values is something you want, check out [superjson](https://github.com/blitz-js/superjson) or similar packages (note that superjson **does not** escape values by itself, so you still need an extra step for escaping the output).

Instead of serializing the whole `dehydratedState` from the outside, you can also let Preact Query do this per-query by configuring `dehydrate.serializeData`/`hydrate.deserializeData` on the `QueryClient`:

```tsx
const queryClient = new QueryClient({
  defaultOptions: {
    dehydrate: {
      serializeData: serialize,
    },
    hydrate: {
      deserializeData: deserialize,
    },
  },
})
```

This transforms each query's `data` on the way out of `dehydrate` and on the way into `hydrate`, so `serialize`/`deserialize` only ever need to handle the shape of your query data, not the full dehydrated state. As with any custom serializer, make sure it's safe against XSS if you end up embedding its output directly into markup.

## Tips, Tricks and Caveats

### Staleness is measured from when the query was fetched on the server

A query is considered stale depending on when it was `dataUpdatedAt`. A caveat here is that the server needs to have the correct time for this to work properly, but UTC time is used, so timezones do not factor into this.

Because `staleTime` defaults to `0`, queries will be refetched in the background on page load by default. You might want to use a higher `staleTime` to avoid this double fetching, especially if you don't cache your markup.

This refetching of stale queries is a perfect match when caching markup in a CDN! You can set the cache time of the page itself decently high to avoid having to re-render pages on the server, but configure the `staleTime` of the queries lower to make sure data is refetched in the background as soon as a user visits the page. Maybe you want to cache the pages for a week, but refetch the data automatically on page load if it's older than a day?

### High memory consumption on server

In case you are creating the `QueryClient` for every request, Preact Query creates the isolated cache for this client, which is preserved in memory for the `gcTime` period. That may lead to high memory consumption on server in case of high number of requests during that period.

On the server, `gcTime` defaults to `Infinity` which disables manual garbage collection and will automatically clear memory once a request has finished. If you are explicitly setting a non-Infinity `gcTime` then you will be responsible for clearing the cache early.

Avoid setting `gcTime` to `0` as it may result in a hydration error. This occurs because the [Hydration Boundary](../reference/functions/HydrationBoundary.md) places necessary data into the cache for rendering, but if the garbage collector removes the data before the rendering completes, issues may arise. If you require a shorter `gcTime`, we recommend setting it to `2 * 1000` to allow sufficient time for the app to reference the data.

To clear the cache after it is not needed and to lower memory consumption, you can add a call to [`queryClient.clear()`](../reference/classes/QueryClient.md#clear) after the request is handled and dehydrated state has been sent to the client.

Alternatively, you can set a smaller `gcTime`.
