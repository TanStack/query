---
id: ssr
title: SSR
---

React Query supports two ways of prefetching data on the server and passing that to the queryClient.

- Prefetch the data yourself and pass it in as `initialData`
  - Quick to set up for simple cases
  - Has some caveats
- Prefetch the query on the server, dehydrate the cache and rehydrate it on the client
  - Requires slightly more setup up front

## Using Next.js

The exact implementation of these mechanisms may vary from platform to platform, but we recommend starting with Next.js which supports [2 forms of pre-rendering](https://nextjs.org/docs/basic-features/data-fetching):

- Static Generation (SSG)
- Server-side Rendering (SSR)

React Query supports both of these forms of pre-rendering regardless of what platform you may be using.

> Note: For notes about how to integrate with the new `/app`-folder in Next.js, see further down in this guide.

### Using `initialData`

Together with Next.js's [`getStaticProps`](https://nextjs.org/docs/basic-features/data-fetching#getstaticprops-static-generation) or [`getServerSideProps`](https://nextjs.org/docs/basic-features/data-fetching#getserversideprops-server-side-rendering), you can pass the data you fetch in either method to `useQuery`'s' `initialData` option. From React Query's perspective, these integrate in the same way, `getStaticProps` is shown below:

```tsx
export async function getStaticProps() {
  const posts = await getPosts()
  return { props: { posts } }
}

function Posts(props) {
  const { data } = useQuery({
    queryKey: ['posts'],
    queryFn: getPosts,
    initialData: props.posts,
  })

  // ...
}
```

The setup is minimal and this can be a quick solution for some cases, but there are a **few tradeoffs to consider** when compared to the full approach:

- If you are calling `useQuery` in a component deeper down in the tree you need to pass the `initialData` down to that point
- If you are calling `useQuery` with the same query in multiple locations, you need to pass `initialData` to all of them
- There is no way to know at what time the query was fetched on the server, so `dataUpdatedAt` and determining if the query needs refetching is based on when the page loaded instead

### Using Hydration

React Query supports prefetching multiple queries on the server in Next.js and then _dehydrating_ those queries to the queryClient. This means the server can prerender markup that is immediately available on page load and as soon as JS is available, React Query can upgrade or _hydrate_ those queries with the full functionality of the library. This includes refetching those queries on the client if they have become stale since the time they were rendered on the server.

To support caching queries on the server and set up hydration:

- Create a new `QueryClient` instance **inside of your app, and on an instance ref (or in React state). This ensures that data is not shared between different users and requests, while still only creating the QueryClient once per component lifecycle.**
- Wrap your app component with `<QueryClientProvider>` and pass it the client instance
- Wrap your app component with `<Hydrate>` and pass it the `dehydratedState` prop from `pageProps`

```tsx
// _app.jsx
import {
  Hydrate,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'

export default function MyApp({ Component, pageProps }) {
  const [queryClient] = React.useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <Hydrate state={pageProps.dehydratedState}>
        <Component {...pageProps} />
      </Hydrate>
    </QueryClientProvider>
  )
}
```

Now you are ready to prefetch some data in your pages with either [`getStaticProps`](https://nextjs.org/docs/basic-features/data-fetching#getstaticprops-static-generation) (for SSG) or [`getServerSideProps`](https://nextjs.org/docs/basic-features/data-fetching#getserversideprops-server-side-rendering) (for SSR). From React Query's perspective, these integrate in the same way, `getStaticProps` is shown below.

- Create a new `QueryClient` instance **for each page request. This ensures that data is not shared between users and requests.**
- Prefetch the data using the clients `prefetchQuery` method and wait for it to complete
- Use `dehydrate` to dehydrate the query cache and pass it to the page via the `dehydratedState` prop. This is the same prop that the cache will be picked up from in your `_app.js`

```tsx
// pages/posts.jsx
import { dehydrate, QueryClient, useQuery } from '@tanstack/react-query'

export async function getStaticProps() {
  const queryClient = new QueryClient()

  await queryClient.prefetchQuery({ queryKey: ['posts'], queryFn: getPosts })

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
    },
  }
}

function Posts() {
  // This useQuery could just as well happen in some deeper child to
  // the "Posts"-page, data will be available immediately either way
  const { data } = useQuery({ queryKey: ['posts'], queryFn: getPosts })

  // This query was not prefetched on the server and will not start
  // fetching until on the client, both patterns are fine to mix
  const { data: otherData } = useQuery({
    queryKey: ['posts-2'],
    queryFn: getPosts,
  })

  // ...
}
```

As demonstrated, it's fine to prefetch some queries and let others fetch on the queryClient. This means you can control what content server renders or not by adding or removing `prefetchQuery` for a specific query.

### Caveat for Next.js rewrites

There's a catch if you're using [Next.js' rewrites feature](https://nextjs.org/docs/api-reference/next.config.js/rewrites) together with [Automatic Static Optimization](https://nextjs.org/docs/advanced-features/automatic-static-optimization) or `getStaticProps`: It will cause a second hydration by React Query. That's because [Next.js needs to ensure that they parse the rewrites](https://nextjs.org/docs/api-reference/next.config.js/rewrites#rewrite-parameters) on the client and collect any params after hydration so that they can be provided in `router.query`.

The result is missing referential equality for all the hydration data, which for example triggers wherever your data is used as props of components or in the dependency array of `useEffect`s/`useMemo`s.

## Using Remix

Remix supports Server-side Rendering (SSR) only.

### Using `initialData`

Together with Remix's [`loader`](https://remix.run/docs/en/v1/api/conventions#loader), you can pass the data you fetch to `useQuery`'s' `initialData` option.

```tsx
export async function loader() {
  const posts = await getPosts()
  return json({ posts })
}

function Posts() {
  const { posts } = useLoaderData()

  const { data } = useQuery({
    queryKey: ['posts'],
    queryFn: getPosts,
    initialData: posts,
  })

  // ...
}
```

The setup is minimal and this can be a quick solution for some cases, but there are a **few tradeoffs to consider** when compared to the full approach:

- If you are calling `useQuery` with the same query in multiple locations, you need to pass `initialData` to all of them
- There is no way to know at what time the query was fetched on the server, so `dataUpdatedAt` and determining if the query needs refetching is based on when the page loaded instead

### Using Hydration

React Query supports prefetching multiple queries on the server in Remix and then _dehydrating_ those queries to the queryClient. This means the server can prerender markup that is immediately available on page load and as soon as JS is available, React Query can upgrade or _hydrate_ those queries with the full functionality of the library. This includes refetching those queries on the client if they have become stale since the time they were rendered on the server.

To support caching queries on the server and set up hydration:

- Create a new `QueryClient` instance **inside of your app, and on an instance ref (or in React state). This ensures that data is not shared between different users and requests, while still only creating the QueryClient once per component lifecycle.**
- Wrap your app component with `<QueryClientProvider>` and pass it the client instance
- Wrap your app component with `<Hydrate>` and pass it the `dehydratedState` prop from `useDehydratedState()`

```bash
npm i use-dehydrated-state
# or
pnpm add use-dehydrated-state
# or
yarn add use-dehydrated-state
```

```tsx
// root.tsx
import {
  Hydrate,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'

import { useDehydratedState } from 'use-dehydrated-state'

export default function MyApp() {
  const [queryClient] = React.useState(() => new QueryClient())

  const dehydratedState = useDehydratedState()

  return (
    <QueryClientProvider client={queryClient}>
      <Hydrate state={dehydratedState}>
        <Outlet />
      </Hydrate>
    </QueryClientProvider>
  )
}
```

Now you are ready to prefetch some data in your [`loader`](https://remix.run/docs/en/v1/api/conventions#loader).

- Create a new `QueryClient` instance **for each page request. This ensures that data is not shared between users and requests.**
- Prefetch the data using the clients `prefetchQuery` method and wait for it to complete
- Use `dehydrate` to dehydrate the query cache and pass it to the page via the `dehydratedState` prop. This is the same prop that `useDehydratedState()` will pick up for caching in your `root.tsx`

```tsx
// pages/posts.tsx
import { dehydrate, QueryClient, useQuery } from '@tanstack/react-query'

export async function loader() {
  const queryClient = new QueryClient()

  await queryClient.prefetchQuery({ queryKey: ['posts'], queryFn: getPosts })

  return json({ dehydratedState: dehydrate(queryClient) })
}

function Posts() {
  // This useQuery could just as well happen in some deeper child to
  // the "Posts"-page, data will be available immediately either way
  const { data } = useQuery({ queryKey: ['posts'], queryFn: getPosts })

  // This query was not prefetched on the server and will not start
  // fetching until on the client, both patterns are fine to mix
  const { data: otherData } = useQuery({
    queryKey: ['posts-2'],
    queryFn: getPosts,
  })

  // ...
}
```

As demonstrated, it's fine to prefetch some queries and let others fetch on the queryClient. This means you can control what content server renders or not by adding or removing `prefetchQuery` for a specific query.

## Using Other Frameworks or Custom SSR Frameworks

This guide is at-best, a high level overview of how SSR with React Query should work. Your mileage may vary since there are many different possible setups for SSR.

> If you can, please contribute your findings back to this page for any framework specific guidance!

### On the Server

- Create a new `QueryClient` instance **inside of your request handler. This ensures that data is not shared between different users and requests.**
- Using the client, prefetch any data you need
- Dehydrate the client
- Render your app with the client provider and also **using the dehydrated state. This is extremely important! You must render both server and client using the same dehydrated state to ensure hydration on the client produces the exact same markup as the server.**
- Serialize and embed the dehydrated cache to be sent to the client with the HTML
- Clear the React Query caches after the dehydrated state has been sent by calling [`queryClient.clear()`](../../../../reference/QueryClient#queryclientclear)

> SECURITY NOTE: Serializing data with `JSON.stringify` can put you at risk for XSS-vulnerabilities, [this blog post explains why and how to solve it](https://medium.com/node-security/the-most-common-xss-vulnerability-in-react-js-applications-2bdffbcc1fa0)

```tsx
import {
  dehydrate,
  Hydrate,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'

async function handleRequest(req, res) {
  const queryClient = new QueryClient()
  await queryClient.prefetchQuery({ queryKey: ['key'], queryFn: fn })
  const dehydratedState = dehydrate(queryClient)

  const html = ReactDOM.renderToString(
    <QueryClientProvider client={queryClient}>
      <Hydrate state={dehydratedState}>
        <App />
      </Hydrate>
    </QueryClientProvider>,
  )

  res.send(`
    <html>
      <body>
        <div id="root">${html}</div>
        <script>
          window.__REACT_QUERY_STATE__ = ${JSON.stringify(dehydratedState)};
        </script>
      </body>
    </html>
  `)

  queryClient.clear()
}
```

### Client

- Parse the dehydrated cache state that was sent to the client with the HTML
- Create a new `QueryClient` instance
- Render your app with the client provider and also **using the dehydrated state. This is extremely important! You must render both server and client using the same dehydrated state to ensure hydration on the client produces the exact same markup as the server.**

```tsx
import {
  Hydrate,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'

const dehydratedState = window.__REACT_QUERY_STATE__

const queryClient = new QueryClient()

ReactDOM.hydrate(
  <QueryClientProvider client={queryClient}>
    <Hydrate state={dehydratedState}>
      <App />
    </Hydrate>
  </QueryClientProvider>,
  document.getElementById('root'),
)
```

## Using the `app` Directory in Next.js 13

Both prefetching approaches, using `initialData` or `<Hydrate>`, are available within the `app` directory.

- Prefetch the data in a Server Component and prop drill `initialData` to Client Components
  - Quick to set up for simple cases
  - May need to prop drill through multiple layers of Client Components
  - May need to prop drill to multiple Client Components using the same query
  - Query refetching is based on when the page loads instead of when the data was prefetched on the server
- Prefetch the query on the server, dehydrate the cache and rehydrate it on the client with `<Hydrate>`
  - Requires slightly more setup up front
  - No need to prop drill
  - Query refetching is based on when the query was prefetched on the server

### `<QueryClientProvider>` is required by both the `initialData` and `<Hydrate>` prefetching approaches

The hooks provided by the `react-query` package need to retrieve a `QueryClient` from their context. Wrap your component tree with `<QueryClientProvider>` and pass it an instance of `QueryClient`.

```tsx
// app/providers.jsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export default function Providers({ children }) {
  const [queryClient] = React.useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
```

```tsx
// app/layout.jsx
import Providers from './providers'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head />
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

### Using `initialData`

Fetch your initial data in a Server Component higher up in the component tree, and pass it to your Client Component as a prop.

```tsx
// app/page.jsx
export default async function Home() {
  const initialData = await getPosts()

  return <Posts posts={initialData} />
}
```

```tsx
// app/posts.jsx
'use client'

import { useQuery } from '@tanstack/react-query'

export function Posts(props) {
  const { data } = useQuery({
    queryKey: ['posts'],
    queryFn: getPosts,
    initialData: props.posts,
  })

  // ...
}
```

### Using `<Hydrate>`

Create a request-scoped singleton instance of `QueryClient`. **This ensures that data is not shared between different users and requests, while still only creating the QueryClient once per request.**

```tsx
// app/getQueryClient.jsx
import { QueryClient } from '@tanstack/react-query'
import { cache } from 'react'

const getQueryClient = cache(() => new QueryClient())
export default getQueryClient
```

Fetch your data in a Server Component higher up in the component tree than the Client Components that use the prefetched queries. Your prefetched queries will be available to all components deeper down the component tree.

- Retrieve the `QueryClient` singleton instance
- Prefetch the data using the client's prefetchQuery method and wait for it to complete
- Use `dehydrate` to obtain the dehydrated state of the prefetched queries from the query cache
- Wrap the component tree that needs the prefetched queries inside `<Hydrate>`, and provide it with the dehydrated state
- You can fetch inside multiple Server Components and use `<Hydrate>` in multiple places

> NOTE: If you encounter a type error while using async Server Components with TypeScript versions lower than `5.1.3` and `@types/react` versions lower than `18.2.8`, it is recommended to update to the latest versions of both. Alternatively, you can use the temporary workaround of adding `{/* @ts-expect-error Server Component */}` when calling this component inside another. For more information, see [Async Server Component TypeScript Error](https://nextjs.org/docs/app/building-your-application/configuring/typescript#async-server-component-typescript-error) in the Next.js 13 docs.

```tsx
// app/hydratedPosts.jsx
import { dehydrate, Hydrate } from '@tanstack/react-query'
import getQueryClient from './getQueryClient'

export default async function HydratedPosts() {
  const queryClient = getQueryClient()
  await queryClient.prefetchQuery({ queryKey: ['posts'], queryFn: getPosts })
  const dehydratedState = dehydrate(queryClient)

  return (
    <Hydrate state={dehydratedState}>
      <Posts />
    </Hydrate>
  )
}
```

During server rendering, calls to `useQuery` nested within the `<Hydrate>` Client Component will have access to prefetched data provided in the state property.

```tsx
// app/posts.jsx
'use client'

import { useQuery } from '@tanstack/react-query'

export default function Posts() {
  // This useQuery could just as well happen in some deeper child to
  // the "HydratedPosts"-component, data will be available immediately either way
  const { data } = useQuery({ queryKey: ['posts'], queryFn: getPosts })

  // This query was not prefetched on the server and will not start
  // fetching until on the client, both patterns are fine to mix
  const { data: otherData } = useQuery({
    queryKey: ['posts-2'],
    queryFn: getPosts,
  })

  // ...
}
```

As demonstrated, it's fine to prefetch some queries and let others fetch on the client. This means you can control what content server renders or not by adding or removing `prefetchQuery` for a specific query.

### Streaming, Suspense and server-side fetching

Right now, you always have to `await` the data in the Server Component. In the future, the goal is to be able to _start_ prefetching in a Server Component but not block rendering, instead streaming markup and data to the client incrementally as it gets available. This is currently lacking support in both React and Query.

Similarily, you _must_ currently prefetch the data in a Server Component if you want it to be server rendered. A `useQuery()` call even with the `suspense` option enabled will not fetch data on the server, only on the client. We hope to support this in the future, but exact details are still unknown.

## Custom SSR with suspense

If you do not want to provide `prefetchQuery()` for all your queries in the SSR you can use suspense.

### Server

```tsx
import {
  dehydrate,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import ssrPrepass from 'react-ssr-prepass'

async function handleRequest(req, res) {
  const queryClient = new QueryClient()

  // React SSR does not support ErrorBoundary
  try {
    // Traverse the tree and fetch all Suspense data (thrown promises)
    await ssrPrepass(<App />)
  } catch (e) {
    console.error(e)
    // Send the index.html (without SSR) on error, so user can try to recover and see something
    return res.sendFile('path/to/dist/index.html')
  }

  const html = ReactDOM.renderToString(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>,
  )

  const dehydratedState = dehydrate(queryClient)

  res.send(`
    <html>
      <body>
        <div id="root">${html}</div>
        <script>
          window.__REACT_QUERY_STATE__ = ${JSON.stringify(dehydratedState)};
        </script>
      </body>
    </html>
  `)

  queryClient.clear()
}
```

### Client

Make sure to [use suspense in your queries](../../../../framework/react/guides/suspense).

## Tips, Tricks and Caveats

### Only successful queries are included in dehydration

Any query with an error is automatically excluded from dehydration. This means that the default behavior is to pretend these queries were never loaded on the server, usually showing a loading state instead, and retrying the queries on the queryClient. This happens regardless of error.

Sometimes this behavior is not desirable, maybe you want to render an error page with a correct status code instead on certain errors or queries. In those cases, use `fetchQuery` and catch any errors to handle those manually.

### Staleness is measured from when the query was fetched on the server

A query is considered stale depending on when it was `dataUpdatedAt`. A caveat here is that the server needs to have the correct time for this to work properly, but UTC time is used, so timezones do not factor into this.

Because `staleTime` defaults to `0`, queries will be refetched in the background on page load by default. You might want to use a higher `staleTime` to avoid this double fetching, especially if you don't cache your markup.

This refetching of stale queries is a perfect match when caching markup in a CDN! You can set the cache time of the page itself decently high to avoid having to re-render pages on the server, but configure the `staleTime` of the queries lower to make sure data is refetched in the background as soon as a user visits the page. Maybe you want to cache the pages for a week, but refetch the data automatically on page load if it's older than a day?

### High memory consumption on server

In case you are creating the `QueryClient` for every request, React Query creates the isolated cache for this client, which is preserved in memory for the `cacheTime` period. That may lead to high memory consumption on server in case of high number of requests during that period.

On the server, `cacheTime` defaults to `Infinity` which disables manual garbage collection and will automatically clear memory once a request has finished. If you are explicitly setting a non-Infinity `cacheTime` then you will be responsible for clearing the cache early.

To clear the cache after it is not needed and to lower memory consumption, you can add a call to [`queryClient.clear()`](../../../../reference/QueryClient#queryclientclear) after the request is handled and dehydrated state has been sent to the client.

Alternatively, you can set a smaller `cacheTime`.
