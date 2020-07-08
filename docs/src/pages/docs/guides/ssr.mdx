---
id: ssr
title: SSR & Next.js
---

## Client Side Data Fetching

If your queries are for data that is frequently updating and you don't necessarily need the data to be preset at render time (for SEO or performance purposes), then you don't need any extra configuration for React Query! Just import `useQuery` and fetch data right from within your components.

This approach works well for applications or user-specific pages that might contain private or non-publi/non-generic information, SEO is usually not relevant to these types of pages and full SSR of data is rarely needed in said situations.

## Pre-rendering

If the page and its data needs to be rendered on the server, React Query comes build in with mechanisms to support this use case. The exact implementation of these mechanisms may vary from platform to platform, but we recommend starting with Next.js which supports [2 forms of pre-rendering](https://nextjs.org/docs/basic-features/data-fetching):

- Static Generation (SSG)
- Server-side Rendering (SSR)

With React Query and Next.js, you can pre-render a page for SEO and gracefully upgrade that page's queries during hydration to support caching, invalidation and background refetching on the client side.

For example, together with Next.js's [`getStaticProps`](https://nextjs.org/docs/basic-features/data-fetching#getstaticprops-static-generation), you can pass the pre-fetched data for the page to `useQuery`'s' `initialData` option:

```jsx
export async function getStaticProps() {
  const posts = await getPosts()
  return { props: { posts } }
}

function Props(props) {
  const { data } = useQuery('posts', getPosts, { initialData: props.posts })

  // ...
}
```

This page would be prerendered using the data fetched in `getStaticProps` and be ready for SEO, then, as soon it mounts on the client, will also be cached and refetched/updated in the background as needed.

## Advanced SSR Concepts

When using SSR (server-side-rendering) with React Query there are a few things to note:

- If you import and use the global `queryCache` directly, queries are not cached during SSR to avoid leaking sensitive information between requests.
- If you create a `queryCache` manually with `makeQueryCache`, queries will be cached during SSR. Make sure you create a separate cache per request to avoid leaking data.
- Queries rendered on the server will by default use the `initialData` of an unfetched query. This means that by default, `data` will be set to `undefined`. To get around this in SSR, you can either pre-seed a query's cache data using the `config.initialData` option:

```js
const queryInfo = useQuery('todos', fetchTodoList, {
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
