---
id: ssr
title: SSR & Next.js
---

## Client Side Data Fetching

If your queries are for data that is frequently updating and you don't necessarily need the data to be present at page load time (for SEO or performance purposes), then you don't need any extra configuration for React Query! Just import `useQuery` and fetch data right from within your components.

This approach works well for applications or user-specific pages that might contain private or non-public/non-generic information. SEO is usually not as relevant to these types of pages and full SSR of data is rarely needed in said situations.

## Server Side Rendering Overview

React Query supports prefetching a query on the server and handing off or _dehydrating_ that query to the client. This means the server can prerender markup that is immediately available on page load and as soon as JS is available, React Query can upgrade or _hydrate_ those queries with the full functionality of the library. This includes refetching those queries on the client if they have become stale since they were rendered on the server.

The exact implementation of these mechanisms may vary from platform to platform, but we recommend starting with Next.js which supports [2 forms of pre-rendering](https://nextjs.org/docs/basic-features/data-fetching):

- Static Generation (SSG)
- Server-side Rendering (SSR)

React Query supports both of these forms of pre-rendering.

## Integrating React Query with Next.js

To support caching queries on the server, you start with wrapping your application with `<ReactQueryCacheProvider>` in `_app.js`:

```jsx
// _app.jsx
import { ReactQueryCacheProvider } from 'react-query'

export default function MyApp({ Component, pageProps }) {
  return (
    <ReactQueryCacheProvider>
      <Component {...pageProps} />
    </ReactQueryCacheProvider>
  )
}
```

Now you are ready to prefetch some data in your pages with either [`getStaticProps`](https://nextjs.org/docs/basic-features/data-fetching#getstaticprops-static-generation) (for SSG) or [`getServerSideProps`](https://nextjs.org/docs/basic-features/data-fetching#getserversideprops-server-side-rendering) (for SSR). From React Query's perspective, these integrate in the same way, `getStaticProps` is shown below:

```jsx
// pages/posts.jsx
import { makeQueryCache } from 'react-query'
import { dehydrate, useHydrate } from 'react-query/hydration'

export async function getStaticProps() {
  const queryCache = makeQueryCache()

  await queryCache.prefetchQuery('posts', getPosts)

  return {
    props: {
      dehydratedQueries: dehydrate(queryCache)
    }
  }
}

function Posts({ dehydratedQueries }) {
  useHydrate(dehydratedQueries)

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

## Integrating with custom SSR solutions or other frameworks

Since there are many different possible setups for SSR, it's hard to give a detailed guide for each (contributions are welcome!). Here is a thorough high level overview:

**Server side**

> Note: The global `queryCache` you can import directly from 'react-query' does not cache queries on the server to avoid leaking sensitive information between requests.

- Prefetch data
  - Create a `prefetchQueryCache` specifically for prefetching by calling `const prefetchQueryCache = makeQueryCache()`
  - Call `prefetchQueryCache.prefetchQuery(...)` to prefetch queries
  - Dehydrate by using `const dehydratedQueries = dehydrate(prefetchQueryCache)`
- Render
  - Wrap the app in `<ReactQueryCacheProvider>`
    - This makes sure a separate `queryCache` is created specifically for rendering
    - **Do not** pass in the `prefetchQueryCache` from the last step, the server and client both needs to render from the dehydrated data to avoid React hydration mismatches. This is because queries with errors are excluded from dehydration.
  - Pass in `dehydratedQueries` from the step above into the app and call `useHydrate(dehydratedQueries)` before you try to use any queries
- Serialize and embed `dehydratedQueries` in the markup
  - Security note: Serializing data with `JSON.stringify` can put you at risk for XSS-vulnerabilities, [this blog post explains why and how to solve it](https://medium.com/node-security/the-most-common-xss-vulnerability-in-react-js-applications-2bdffbcc1fa0)

**Client side**

- Parse `dehydratedQueries` from where you put it in the markup
- Render
  - Wrap the app in `<ReactQueryCacheProvider>`
  - Pass in `dehydratedQueries` from the step above into the app and call `useHydrate(dehydratedQueries)` before you try to use any queries (probably in the same component as on the server)

This list aims to be exhaustive, depending on your current setup, the above steps can take more or less work.

## Tips, Tricks and Caveats

**Only successful queries are included in dehydration**

Any query with an error is automatically excluded from dehydration. This means that the default behaviour is to pretend these queries were never loaded on the server, usually showing a loading state instead, and retrying the queries on the client. This happens regardless of error.

Sometimes this behavior is not desirable, maybe you want to render an error page with a correct status code instead on certain errors or queries. In those cases, pass `throwOnError: true` to the specific `prefetchQuery` to be able to catch and handle those errors manually.

**Staleness is measured from when the query was fetched on the server**

A query is considered stale depending on when it was `updatedAt`. A caveat here is that the server needs to have the correct time for this to work properly, but UTC time is used, so timezones do not factor into this.

Because `staleTime` defaults to `0`, queries will be refetched in the background on page load by default. You might want to use a higher `staleTime` to avoid this double fetching, especially if you don't cache your markup.

This refetching of stale queries is a perfect match when caching markup in a CDN! You can set the cache time of the page itself decently high to avoid having to re-render pages on the server, but configure the `staleTime` of the queries lower to make sure data is refetched in the background as soon as a user visits the page. Maybe you want to cache the pages for a week, but refetch the data automatically on page load if it's older than a day?
