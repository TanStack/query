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

React Query supports both of these forms of pre-rendering regardless of what platform you may be using

### Using `initialData`

Together with Next.js's [`getStaticProps`](https://nextjs.org/docs/basic-features/data-fetching#getstaticprops-static-generation) or [`getServerSideProps`](https://nextjs.org/docs/basic-features/data-fetching#getserversideprops-server-side-rendering), you can pass the data you fetch in either method to `useQuery`'s' `initialData` option. From React Query's perspective, these integrate in the same way, `getStaticProps` is shown below:

```js
export async function getStaticProps() {
  const posts = await getPosts()
  return { props: { posts } }
}

function Posts(props) {
  const { data } = useQuery('posts', getPosts, { initialData: props.posts })

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

```js
// _app.jsx
import { QueryClient, QueryClientProvider } from 'react-query'
import { Hydrate } from 'react-query/hydration'

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

```js
// pages/posts.jsx
import { QueryClient, useQuery } from 'react-query'
import { dehydrate } from 'react-query/hydration'

export async function getStaticProps() {
  const queryClient = new QueryClient()

  await queryClient.prefetchQuery('posts', getPosts)

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
    },
  }
}

function Posts() {
  // This useQuery could just as well happen in some deeper child to
  // the "Posts"-page, data will be available immediately either way
  const { data } = useQuery('posts', getPosts)

  // This query was not prefetched on the server and will not start
  // fetching until on the client, both patterns are fine to mix
  const { data: otherData } = useQuery('posts-2', getPosts)

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

> SECURITY NOTE: Serializing data with `JSON.stringify` can put you at risk for XSS-vulnerabilities, [this blog post explains why and how to solve it](https://medium.com/node-security/the-most-common-xss-vulnerability-in-react-js-applications-2bdffbcc1fa0)

```js
import { QueryClient, QueryClientProvider } from 'react-query'
import { dehydrate, Hydrate } from 'react-query/hydration'

function handleRequest (req, res) {
  const queryClient = new QueryClient()
  await queryClient.prefetchQuery('key', fn)
  const dehydratedState = dehydrate(queryClient)

  const html = ReactDOM.renderToString(
    <QueryClientProvider client={queryClient}>
      <Hydrate state={dehydratedState}>
        <App />
      </Hydrate>
    </QueryClientProvider>
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
}
```

### Client

- Parse the dehydrated cache state that was sent to the client with the HTML
- Create a new `QueryClient` instance
- Render your app with the client provider and also **using the dehydrated state. This is extremely important! You must render both server and client using the same dehydrated state to ensure hydration on the client produces the exact same markup as the server.**

```js
import { QueryClient, QueryClientProvider } from 'react-query'
import { Hydrate } from 'react-query/hydration'

const dehydratedState = window.__REACT_QUERY_STATE__

const queryClient = new QueryClient()

ReactDOM.hydrate(
  <QueryClientProvider client={queryClient}>
    <Hydrate state={dehydratedState}>
      <App />
    </Hydrate>
  </QueryClientProvider>,
  document.getElementById('root')
)
```

## Tips, Tricks and Caveats

### Only successful queries are included in dehydration

Any query with an error is automatically excluded from dehydration. This means that the default behaviour is to pretend these queries were never loaded on the server, usually showing a loading state instead, and retrying the queries on the queryClient. This happens regardless of error.

Sometimes this behavior is not desirable, maybe you want to render an error page with a correct status code instead on certain errors or queries. In those cases, use `fetchQuery` and catch any errors to handle those manually.

### Staleness is measured from when the query was fetched on the server

A query is considered stale depending on when it was `dataUpdatedAt`. A caveat here is that the server needs to have the correct time for this to work properly, but UTC time is used, so timezones do not factor into this.

Because `staleTime` defaults to `0`, queries will be refetched in the background on page load by default. You might want to use a higher `staleTime` to avoid this double fetching, especially if you don't cache your markup.

This refetching of stale queries is a perfect match when caching markup in a CDN! You can set the cache time of the page itself decently high to avoid having to re-render pages on the server, but configure the `staleTime` of the queries lower to make sure data is refetched in the background as soon as a user visits the page. Maybe you want to cache the pages for a week, but refetch the data automatically on page load if it's older than a day?
