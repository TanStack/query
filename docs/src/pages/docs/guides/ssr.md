---
id: ssr
title: SSR & Next.js
---

## Client Side Data Fetching

If your queries are for data that is frequently updating and you don't necessarily need the data to be present at page load time (for SEO or performance purposes), then you don't need any extra configuration for React Query! Just import `useQuery` and fetch data right from within your components.

This approach works well for applications or user-specific pages that might contain private or non-public/non-generic information. SEO is usually not as relevant to these types of pages and full SSR of data is rarely needed in said situations.

## Server Side Rendering Overview

React Query supports two ways of prefetching data on the server and passing that to the client.

- Prefetch the data yourself and pass it in as `initialData`
  - Quick to set up for simple cases
  - Has some caveats
- Prefetch the query via React Query and use de/rehydration
  - Requires slightly more setup up front

The exact implementation of these mechanisms may vary from platform to platform, but we recommend starting with Next.js which supports [2 forms of pre-rendering](https://nextjs.org/docs/basic-features/data-fetching):

- Static Generation (SSG)
- Server-side Rendering (SSR)

React Query supports both of these forms of pre-rendering.

## Prefetch the data yourself and pass it in as `initialData`

Together with Next.js's [`getStaticProps`](https://nextjs.org/docs/basic-features/data-fetching#getstaticprops-static-generation), you can pass the pre-fetched data for the page to `useQuery`'s' `initialData` option:

```jsx
export async function getStaticProps() {
  const posts = await getPosts()
  return { props: { posts } }
}

function Posts(props) {
  const { data } = useQuery('posts', getPosts, { initialData: props.posts })

  // ...
}
```

The setup is minimal and this can be a perfect solution for some cases, but there are a few tradeoffs compared to the full approach:

- If you are calling `useQuery` in a component deeper down in the tree you need to pass the `initialData` down to that point
- If you are calling `useQuery` with the same query in multiple locations, you need to pass `initialData` to all of them
- There is no way to know at what time the query was fetched on the server, so `updatedAt` and determining if the query needs refetching is based on when the page loaded instead

## Prefetch the query via React Query and use de/rehydration

React Query supports prefetching a query on the server and handing off or _dehydrating_ that query to the client. This means the server can prerender markup that is immediately available on page load and as soon as JS is available, React Query can upgrade or _hydrate_ those queries with the full functionality of the library. This includes refetching those queries on the client if they have become stale since the time they were rendered on the server.

### Integrating with Next.js

To support caching queries on the server and set up hydration, you start with wrapping your application with `<ReactQueryCacheProvider>` and `<Hydrate>` in `_app.js`.

```jsx
// _app.jsx
import { ReactQueryCacheProvider, QueryCache } from 'react-query'
import { Hydrate } from 'react-query/hydration'

const queryCache = new QueryCache()

export default function MyApp({ Component, pageProps }) {
  return (
    <ReactQueryCacheProvider queryCache={queryCache}>
      <Hydrate state={pageProps.dehydratedState}>
        <Component {...pageProps} />
      </Hydrate>
    </ReactQueryCacheProvider>
  )
}
```

Now you are ready to prefetch some data in your pages with either [`getStaticProps`](https://nextjs.org/docs/basic-features/data-fetching#getstaticprops-static-generation) (for SSG) or [`getServerSideProps`](https://nextjs.org/docs/basic-features/data-fetching#getserversideprops-server-side-rendering) (for SSR). From React Query's perspective, these integrate in the same way, `getStaticProps` is shown below:

```jsx
// pages/posts.jsx
import { QueryCache } from 'react-query'
import { dehydrate } from 'react-query/hydration'

export async function getStaticProps() {
  const queryCache = new QueryCache()

  await queryCache.prefetchQuery('posts', getPosts)

  return {
    props: {
      dehydratedState: dehydrate(queryCache),
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

As demonstrated, it's fine to prefetch some queries and let some fetch on the client. This means you can control what content server renders or not by adding or removing `prefetchQuery` for a specific query.

### Integrating with custom SSR solutions or other frameworks

Since there are many different possible setups for SSR, it's hard to give a detailed guide for each (contributions are welcome!). Here is a thorough high level overview:

**Server side**

> Note: The global `queryCache` you can import directly from 'react-query' does not cache queries on the server to avoid leaking sensitive information between requests.

- Prefetch data
  - Create a `prefetchCache` specifically for prefetching by calling `const prefetchCache = new QueryCache()`
  - Call `prefetchCache.prefetchQuery(...)` to prefetch queries
  - Dehydrate by using `const dehydratedState = dehydrate(prefetchCache)`
- Render
  - Create a new query cache for rendering and hydrate the state. Use this query cache to render your app.
    - **Do not** use the `prefetchCache` to render your app, the server and client both needs to render from the dehydrated data to avoid React hydration mismatches. This is because queries with errors are excluded from dehydration by default.
- Serialize and embed `dehydratedState` in the markup
  - Security note: Serializing data with `JSON.stringify` can put you at risk for XSS-vulnerabilities, [this blog post explains why and how to solve it](https://medium.com/node-security/the-most-common-xss-vulnerability-in-react-js-applications-2bdffbcc1fa0)

**Client side**

- Parse `dehydratedState` from where you put it in the markup
- Create a cache and hydrate the state
- Render

This list aims to be exhaustive, but depending on your current setup, the above steps can take more or less work. Here is a barebones example:

```jsx
// Server
const prefetchCache = new QueryCache()
await prefetchCache.prefetchQuery('key', fn)
const dehydratedState = dehydrate(prefetchCache)

const renderCache = new QueryCache()
hydrate(renderCache, dehydratedState)

const html = ReactDOM.renderToString(
  <ReactQueryCacheProvider queryCache={renderCache}>
    <App />
  </ReactQueryCacheProvider>
)

res.send(`
<html>
  <body>
    <div id="app">${html}</div>
    <script>window.__REACT_QUERY_INITIAL_QUERIES__ = ${JSON.stringify(
      dehydratedState
    )};</script>
  </body>
</html>
`)

// Client
const dehydratedState = JSON.parse(window.__REACT_QUERY_INITIAL_QUERIES__)

const queryCache = new QueryCache()
hydrate(queryCache, dehydratedState)

ReactDOM.hydrate(
  <ReactQueryCacheProvider queryCache={queryCache}>
    <App />
  </ReactQueryCacheProvider>,
  document.getElementById('root')
)
```

### Tips, Tricks and Caveats

**Only successful queries are included in dehydration**

Any query with an error is automatically excluded from dehydration. This means that the default behaviour is to pretend these queries were never loaded on the server, usually showing a loading state instead, and retrying the queries on the client. This happens regardless of error.

Sometimes this behavior is not desirable, maybe you want to render an error page with a correct status code instead on certain errors or queries. In those cases, use `fetchQuery` and catch any errors to handle those manually.

**Staleness is measured from when the query was fetched on the server**

A query is considered stale depending on when it was `updatedAt`. A caveat here is that the server needs to have the correct time for this to work properly, but UTC time is used, so timezones do not factor into this.

Because `staleTime` defaults to `0`, queries will be refetched in the background on page load by default. You might want to use a higher `staleTime` to avoid this double fetching, especially if you don't cache your markup.

This refetching of stale queries is a perfect match when caching markup in a CDN! You can set the cache time of the page itself decently high to avoid having to re-render pages on the server, but configure the `staleTime` of the queries lower to make sure data is refetched in the background as soon as a user visits the page. Maybe you want to cache the pages for a week, but refetch the data automatically on page load if it's older than a day?
