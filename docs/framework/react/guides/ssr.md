---
id: ssr
title: Server Rendering & Hydration
---

In this guide you'll learn how to use React Query with server rendering.

See the guide on [Prefetching & Router Integration](./prefetching.md) for some background. You might also want to check out the [Performance & Request Waterfalls guide](./request-waterfalls.md) before that.

For advanced server rendering patterns, such as streaming, Server Components and the new Next.js app router, see the [Advanced Server Rendering guide](./advanced-ssr.md).

If you just want to see some code, you can skip ahead to the [Full Next.js pages router example](#full-nextjs-pages-router-example) or the [Full Remix example](#full-remix-example) below.

## Server Rendering & React Query

So what is server rendering anyway? The rest of this guide will assume you are familiar with the concept, but let's spend some time to look at how it relates to React Query. Server rendering is the act of generating the initial html on the server, so that the user has some content to look at as soon as the page loads. This can happen on demand when a page is requested (SSR). It can also happen ahead of time either because a previous request was cached, or at build time (SSG).

If you've read the Request Waterfalls guide, you might remember this:

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

This is all from the clients perspective. On the server, we need to **prefetch** that data before we generate/render the markup, we need to **dehydrate** that data into a serializable format we can embed in the markup, and on the client we need to **hydrate** that data into a React Query cache so we can avoid doing a new fetch on the client.

Read on to learn how to implement these three steps with React Query.

## A quick note on Suspense

This guide uses the regular `useQuery` API. While we don't necessarily recommend it, it is possible to replace this with `useSuspenseQuery` instead **as long as you always prefetch all your queries**. The upside is that you get to use `<Suspense>` for loading states on the client.

If you do forget to prefetch a query when you are using `useSuspenseQuery`, the consequences will depend on the framework you are using. In some cases, the data will Suspend and get fetched on the server but never be hydrated to the client, where it will fetch again. In these cases you will get a markup hydration mismatch, because the server and the client tried to render different things.

## Initial setup

The first steps of using React Query is always to create a `queryClient` and wrap the application in a `<QueryClientProvider>`. When doing server rendering, it's important to create the `queryClient` instance **inside of your app**, in React state (an instance ref works fine too). **This ensures that data is not shared between different users and requests**, while still only creating the `queryClient` once per component lifecycle.

Next.js pages router:

```tsx
// _app.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// NEVER DO THIS:
// const queryClient = new QueryClient()
//
// Creating the queryClient at the file root level makes the cache shared
// between all requests and means _all_ data gets passed to _all_ users.
// Besides being bad for performance, this also leaks any sensitive data.

export default function MyApp({ Component, pageProps }) {
  // Instead do this, which ensures each request has its own cache:
  const [queryClient] = React.useState(
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
    <QueryClientProvider client={queryClient}>
      <Component {...pageProps} />
    </QueryClientProvider>
  )
}
```

Remix:

```tsx
// app/root.tsx
import { Outlet } from '@remix-run/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export default function MyApp() {
  const [queryClient] = React.useState(
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
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  )
}
```

## Get started fast with `initialData`

The quickest way to get started is to not involve React Query at all when it comes to prefetching and not use the `dehydrate`/`hydrate` APIs. What you do instead is passing the raw data in as the `initialData` option to `useQuery`. Let's look at an example using Next.js pages router, using `getServerSideProps`.

```tsx
export async function getServerSideProps() {
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

This also works with `getStaticProps` or even the older `getInitialProps` and the same pattern can be applied in any other framework that has equivalent functions. This is what the same example looks like with Remix:

```tsx
export async function loader() {
  const posts = await getPosts()
  return json({ posts })
}

function Posts() {
  const { posts } = useLoaderData<typeof loader>()

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
- If you are calling `useQuery` with the same query in multiple locations, passing `initialData` to only one of them can be brittle and break when your app changes since. If you remove or move the component that has the `useQuery` with `initialData`, the more deeply nested `useQuery` might no longer have any data. Passing `initialData` to **all** queries that needs it can also be cumbersome.
- There is no way to know at what time the query was fetched on the server, so `dataUpdatedAt` and determining if the query needs refetching is based on when the page loaded instead
- If there is already data in the cache for a query, `initialData` will never overwrite this data, **even if the new data is fresher than the old one**.
  - To understand why this is especially bad, consider the `getServerSideProps` example above. If you navigate back and forth to a page several times, `getServerSideProps` would get called each time and fetch new data, but because we are using the `initialData` option, the client cache and data would never be updated.

Setting up the full hydration solution is straightforward and does not have these drawbacks, this will be the focus for the rest of the documentation.

## Using the Hydration APIs

With just a little more setup, you can use a `queryClient` to prefetch queries during a preload phase, pass a serialized version of that `queryClient` to the rendering part of the app and reuse it there. This avoids the drawbacks above. Feel free to skip ahead for full Next.js pages router and Remix examples, but at a general level these are the extra steps:

- In the framework loader function, create a `const queryClient = new QueryClient(options)`
- In the loader function, do `await queryClient.prefetchQuery(...)` for each query you want to prefetch
  - You want to use `await Promise.all(...)` to fetch the queries in parallel when possible
  - It's fine to have queries that aren't prefetched. These wont be server rendered, instead they will be fetched on the client after the application is interactive. This can be great for content that are shown only after user interaction, or is far down on the page to avoid blocking more critical content.
- From the loader, return `dehydrate(queryClient)`, note that the exact syntax to return this differs between frameworks
- Wrap your tree with `<HydrationBoundary state={dehydratedState}>` where `dehydratedState` comes from the framework loader. How you get `dehydratedState` also differs between frameworks.
  - This can be done for each route, or at the top of the application to avoid boilerplate, see examples

> An interesting detail is that there are actually _three_ `queryClient`s involved. The framework loaders are a form of "preloading" phase that happens before rendering, and this phase has its own `queryClient` that does the prefetching. The dehydrated result of this phase gets passed to **both** the server rendering process **and** the client rendering process which each has its own `queryClient`. This ensures they both start with the same data so they can return the same markup.

> Server Components are another form of "preloading" phase, that can also "preload" (pre-render) parts of a React component tree. Read more in the [Advanced Server Rendering guide](./advanced-ssr.md).

### Full Next.js pages router example

> For app router documentation, see the [Advanced Server Rendering guide](./advanced-ssr.md).

Initial setup:

```tsx
// _app.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export default function MyApp({ Component, pageProps }) {
  const [queryClient] = React.useState(
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
    <QueryClientProvider client={queryClient}>
      <Component {...pageProps} />
    </QueryClientProvider>
  )
}
```

In each route:

```tsx
// pages/posts.tsx
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
  useQuery,
} from '@tanstack/react-query'

// This could also be getServerSideProps
export async function getStaticProps() {
  const queryClient = new QueryClient()

  await queryClient.prefetchQuery({
    queryKey: ['posts'],
    queryFn: getPosts,
  })

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
    },
  }
}

function Posts() {
  // This useQuery could just as well happen in some deeper child to
  // the <PostsRoute>, data will be available immediately either way
  const { data } = useQuery({ queryKey: ['posts'], queryFn: getPosts })

  // This query was not prefetched on the server and will not start
  // fetching until on the client, both patterns are fine to mix
  const { data: commentsData } = useQuery({
    queryKey: ['posts-comments'],
    queryFn: getComments,
  })

  // ...
}

export default function PostsRoute({ dehydratedState }) {
  return (
    <HydrationBoundary state={dehydratedState}>
      <Posts />
    </HydrationBoundary>
  )
}
```

### Full Remix example

Initial setup:

```tsx
// app/root.tsx
import { Outlet } from '@remix-run/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export default function MyApp() {
  const [queryClient] = React.useState(
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
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  )
}
```

In each route, note that it's fine to do this in nested routes too:

```tsx
// app/routes/posts.tsx
import { json } from '@remix-run/node'
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
  useQuery,
} from '@tanstack/react-query'

export async function loader() {
  const queryClient = new QueryClient()

  await queryClient.prefetchQuery({
    queryKey: ['posts'],
    queryFn: getPosts,
  })

  return json({ dehydratedState: dehydrate(queryClient) })
}

function Posts() {
  // This useQuery could just as well happen in some deeper child to
  // the <PostsRoute>, data will be available immediately either way
  const { data } = useQuery({ queryKey: ['posts'], queryFn: getPosts })

  // This query was not prefetched on the server and will not start
  // fetching until on the client, both patterns are fine to mix
  const { data: commentsData } = useQuery({
    queryKey: ['posts-comments'],
    queryFn: getComments,
  })

  // ...
}

export default function PostsRoute() {
  const { dehydratedState } = useLoaderData<typeof loader>()
  return (
    <HydrationBoundary state={dehydratedState}>
      <Posts />
    </HydrationBoundary>
  )
}
```

## Optional - Remove boilerplate

Having this part in every route might seem like a lot of boilerplate:

```tsx
export default function PostsRoute({ dehydratedState }) {
  return (
    <HydrationBoundary state={dehydratedState}>
      <Posts />
    </HydrationBoundary>
  )
}
```

While there is nothing wrong with this approach, if you want to get rid of this boilerplate, here's how you can modify your setup in Next.js:

```tsx
// _app.tsx
import {
  HydrationBoundary,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'

export default function MyApp({ Component, pageProps }) {
  const [queryClient] = React.useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <HydrationBoundary state={pageProps.dehydratedState}>
        <Component {...pageProps} />
      </HydrationBoundary>
    </QueryClientProvider>
  )
}

// pages/posts.tsx
// Remove PostsRoute with the HydrationBoundary and instead export Posts directly:
export default function Posts() { ... }
```

With Remix, this is a little bit more involved, we recommend checking out the [use-dehydrated-state](https://github.com/maplegrove-io/use-dehydrated-state) package.

## Prefetching dependent queries

Over in the Prefetching guide we learned how to [prefetch dependent queries](./prefetching.md#dependent-queries--code-splitting), but how do we do this in framework loaders? Consider the following code, taken from the [Dependent Queries guide](./dependent-queries.md):

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
// For Remix, rename this to loader instead
export async function getServerSideProps() {
  const queryClient = new QueryClient()

  const user = await queryClient.fetchQuery({
    queryKey: ['user', email],
    queryFn: getUserByEmail,
  })

  if (user?.userId) {
    await queryClient.prefetchQuery({
      queryKey: ['projects', userId],
      queryFn: getProjectsByUser,
    })
  }

  // For Remix:
  // return json({ dehydratedState: dehydrate(queryClient) })
  return { props: { dehydratedState: dehydrate(queryClient) } }
}
```

This can get more complex of course, but since these loader functions are just JavaScript, you can use the full power of the language to build your logic. Make sure you prefetch all queries that you want to be server rendered.

## Error handling

React Query defaults to a graceful degradation strategy. This means:

- `queryClient.prefetchQuery(...)` never throws errors
- `dehydrate(...)` only includes successful queries, not failed ones

This will lead to any failed queries being retried on the client and that the server rendered output will include loading states instead of the full content.

While a good default, sometimes this is not what you want. When critical content is missing, you might want to respond with a 404 or 500 status code depending on the situation. For these cases, use `queryClient.fetchQuery(...)` instead, which will throw errors when it fails, letting you handle things in a suitable way.

```tsx
let result

try {
  result = await queryClient.fetchQuery(...)
} catch (error) {
  // Handle the error, refer to your framework documentation
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

When doing `return { props: { dehydratedState: dehydrate(queryClient) } }` in Next.js, or `return json({ dehydratedState: dehydrate(queryClient) })` in Remix, what happens is that the `dehydratedState` representation of the `queryClient` is serialized by the framework so it can be embedded into the markup and transported to the client.

By default, these frameworks only supports returning things that are safely serializable/parsable, and therefore does not support `undefined`, `Error`, `Date`, `Map`, `Set`, `BigInt`, `Infinity`, `NaN`, `-0`, regular expressions etc. This also means that you can not return any of these things from your queries. If returning these values is something you want, check out [superjson](https://github.com/blitz-js/superjson) or similar packages.

If you are using a custom SSR setup, you need to take care of this step yourself. Your first instinct might be to use `JSON.stringify(dehydratedState)`, but because this doesn't escape things like `<script>alert('Oh no..')</script>` by default, this can easily lead to **XSS-vulnerabilities** in your application. [superjson](https://github.com/blitz-js/superjson) also **does not** escape values and is unsafe to use by itself in a custom SSR setup (unless you add an extra step for escaping the output). Instead we recommend using a library like [Serialize JavaScript](https://github.com/yahoo/serialize-javascript) or [devalue](https://github.com/Rich-Harris/devalue) which are both safe against XSS injections out of the box.

## A note about request waterfalls

In the [Performance & Request Waterfalls guide](./request-waterfalls.md) we mentioned we would revisit how server rendering changes one of the more complex nested waterfalls. Check back for the [specific code example](./request-waterfalls#code-splitting), but as a refresher, we have a code split `<GraphFeedItem>` component inside a `<Feed>` component. This only renders if the feed contains a graph item and both of these components fetches their own data. With client rendering, this leads to the following request waterfall:

```
1. |> Markup (without content)
2.   |> JS for <Feed>
3.     |> getFeed()
4.       |> JS for <GraphFeedItem>
5.         |> getGraphDataById()
```

The nice thing about server rendering is that we can turn the above into:

```
1. |> Markup (with content AND initial data)
2.   |> JS for <Feed>
2.   |> JS for <GraphFeedItem>
```

Note that the queries are no longer fetched on the client, instead their data was included in the markup. The reason we can now load the JS in parallel is that since `<GraphFeedItem>` was rendered on the server we know that we are going to need this JS on the client as well and can insert a script-tag for this chunk in the markup. On the server, we would still have this request waterfall:

```
1. |> getFeed()
2.   |> getGraphDataById()
```

We simply can not know before we have fetched the feed if we also need to fetch graph data, they are dependent queries. Because this happens on the server where latency is generally both lower and more stable, this often isn't such a big deal.

Amazing, we've mostly flattened our waterfalls! There's a catch though. Let's call this page the `/feed` page, and let's pretend we also have another page like `/posts`. If we type in `www.example.com/feed` directly in the url bar and hit enter, we get all these great server rendering benefits, BUT, if we instead type in `www.example.com/posts` and then **click a link** to `/feed`, we're back to this:

```
1. |> JS for <Feed>
2.   |> getFeed()
3.     |> JS for <GraphFeedItem>
4.       |> getGraphDataById()
```

This is because with SPA's, server rendering only works for the initial page load, not for any subsequent navigation.

Modern frameworks often try to solve this by fetching the initial code and data in parallel, so if you were using Next.js or Remix with the prefetching patterns we outlined in this guide, including how to prefetch dependent queries, it would actually look like this instead:

```
1. |> JS for <Feed>
1. |> getFeed() + getGraphDataById()
2.   |> JS for <GraphFeedItem>
```

This is much better, but if we want to improve this further we can flatten this to a single roundtrip with Server Components. Learn how in the [Advanced Server Rendering guide](./advanced-ssr.md).

## Tips, Tricks and Caveats

### Staleness is measured from when the query was fetched on the server

A query is considered stale depending on when it was `dataUpdatedAt`. A caveat here is that the server needs to have the correct time for this to work properly, but UTC time is used, so timezones do not factor into this.

Because `staleTime` defaults to `0`, queries will be refetched in the background on page load by default. You might want to use a higher `staleTime` to avoid this double fetching, especially if you don't cache your markup.

This refetching of stale queries is a perfect match when caching markup in a CDN! You can set the cache time of the page itself decently high to avoid having to re-render pages on the server, but configure the `staleTime` of the queries lower to make sure data is refetched in the background as soon as a user visits the page. Maybe you want to cache the pages for a week, but refetch the data automatically on page load if it's older than a day?

### High memory consumption on server

In case you are creating the `QueryClient` for every request, React Query creates the isolated cache for this client, which is preserved in memory for the `gcTime` period. That may lead to high memory consumption on server in case of high number of requests during that period.

On the server, `gcTime` defaults to `Infinity` which disables manual garbage collection and will automatically clear memory once a request has finished. If you are explicitly setting a non-Infinity `gcTime` then you will be responsible for clearing the cache early.

Avoid setting `gcTime` to `0` as it may result in a hydration error. This occurs because the [Hydration Boundary](../reference/hydration.md#hydrationboundary) places necessary data into the cache for rendering, but if the garbage collector removes the data before the rendering completes, issues may arise. If you require a shorter `gcTime`, we recommend setting it to `2 * 1000` to allow sufficient time for the app to reference the data.

To clear the cache after it is not needed and to lower memory consumption, you can add a call to [`queryClient.clear()`](../../../reference/QueryClient.md#queryclientclear) after the request is handled and dehydrated state has been sent to the client.

Alternatively, you can set a smaller `gcTime`.

### Caveat for Next.js rewrites

There's a catch if you're using [Next.js' rewrites feature](https://nextjs.org/docs/app/api-reference/next-config-js/rewrites) together with [Automatic Static Optimization](https://nextjs.org/docs/pages/building-your-application/rendering/automatic-static-optimization) or `getStaticProps`: It will cause a second hydration by React Query. That's because [Next.js needs to ensure that they parse the rewrites](https://nextjs.org/docs/app/api-reference/next-config-js/rewrites#rewrite-parameters) on the client and collect any params after hydration so that they can be provided in `router.query`.

The result is missing referential equality for all the hydration data, which for example triggers wherever your data is used as props of components or in the dependency array of `useEffect`s/`useMemo`s.
