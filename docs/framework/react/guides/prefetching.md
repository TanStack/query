---
id: prefetching
title: Prefetching & Router Integration
---

When you know or suspect that a certain piece of data will be needed, you can use prefetching to populate the cache with that data ahead of time, leading to a faster experience.

There are a few different prefetching patterns:

1. In event handlers
2. In components
3. Via router integration
4. During Server Rendering (another form of router integration)

In this guide, we'll take a look at the first three, while the fourth will be covered in depth in the [Server Rendering & Hydration guide](./ssr) and the [Advanced Server Rendering guide](./advanced-ssr).

One specific use of prefetching is to avoid Request Waterfalls, for an in-depth background and explanation of those, see the [Performance & Request Waterfalls guide](./request-waterfalls).

## prefetchQuery & prefetchInfiniteQuery

Before jumping into the different specific prefetch patterns, let's look at the `prefetchQuery` and `prefetchInfiniteQuery` functions. First a few basics:

- Out of the box, these functions use the default `staleTime` configured for the `queryClient` to determine whether existing data in the cache is fresh or needs to be fetched again
- You can also pass a specific `staleTime` like this: `prefetchQuery({ queryKey: ['todos'], queryFn: fn, staleTime: 5000 })`
  - This `staleTime` is only used for the prefetch, you still need to set it for any `useQuery` call as well
  - If you want to ignore `staleTime` and instead always return data if it's available in the cache, you can use the `ensureQueryData` function.
  - Tip: If you are prefetching on the server, set a default `staleTime` higher than `0` for that `queryClient` to avoid having to pass in a specific `staleTime` to each prefetch call
- If no instances of `useQuery` appear for a prefetched query, it will be deleted and garbage collected after the time specified in `gcTime`
- These functions returns `Promise<void>` and thus never return query data. If that's something you need, use `fetchQuery`/`fetchInfiniteQuery` instead.
- The prefetch functions never throws errors because they usually try to fetch again in a `useQuery` which is a nice graceful fallback. If you need to catch errors, use `fetchQuery`/`fetchInfiniteQuery` instead.

This is how you use `prefetchQuery`:

[//]: # 'ExamplePrefetchQuery'

```tsx
const prefetchTodos = async () => {
  // The results of this query will be cached like a normal query
  await queryClient.prefetchQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos,
  })
}
```

[//]: # 'ExamplePrefetchQuery'

Infinite Queries can be prefetched like regular Queries. Per default, only the first page of the Query will be prefetched and will be stored under the given QueryKey. If you want to prefetch more than one page, you can use the `pages` option, in which case you also have to provide a `getNextPageParam` function:

[//]: # 'ExamplePrefetchInfiniteQuery'

```tsx
const prefetchProjects = async () => {
  // The results of this query will be cached like a normal query
  await queryClient.prefetchInfiniteQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => lastPage.nextCursor,
    pages: 3, // prefetch the first 3 pages
  })
}
```

[//]: # 'ExamplePrefetchInfiniteQuery'

Next, let's look at how you can use these and other ways to prefetch in different situations.

## Prefetch in event handlers

A straightforward form of prefetching is doing it when the user interacts with something. In this example we'll use `queryClient.prefetchQuery` to start a prefetch on `onMouseEnter` or `onFocus`.

[//]: # 'ExampleEventHandler'

```tsx
function ShowDetailsButton() {
  const queryClient = useQueryClient()

  const prefetch = () => {
    queryClient.prefetchQuery({
      queryKey: ['details'],
      queryFn: getDetailsData,
      // Prefetch only fires when data is older than the staleTime,
      // so in a case like this you definitely want to set one
      staleTime: 60000,
    })
  }

  return (
    <button onMouseEnter={prefetch} onFocus={prefetch} onClick={...}>
      Show Details
    </button>
  )
}
```

[//]: # 'ExampleEventHandler'

## Prefetch in components

Prefetching during the component lifecycle is useful when we know some child or descendant will need a particular piece of data, but we can't render that until some other query has finished loading. Let's borrow an example from the Request Waterfall guide to explain:

[//]: # 'ExampleComponent'

```tsx
function Article({ id }) {
  const { data: articleData, isPending } = useQuery({
    queryKey: ['article', id],
    queryFn: getArticleById,
  })

  if (isPending) {
    return 'Loading article...'
  }

  return (
    <>
      <ArticleHeader articleData={articleData} />
      <ArticleBody articleData={articleData} />
      <Comments id={id} />
    </>
  )
}

function Comments({ id }) {
  const { data, isPending } = useQuery({
    queryKey: ['article-comments', id],
    queryFn: getArticleCommentsById,
  })

  ...
}
```

[//]: # 'ExampleComponent'

This results in a request waterfall looking like this:

```
1. |> getArticleById()
2.   |> getArticleCommentsById()
```

As mentioned in that guide, one way to flatten this waterfall and improve performance is to hoist the `getArticleCommentsById` query to the parent and pass down the result as a prop, but what if this is not feasible or desirable, for example when the components are unrelated and have multiple levels between them?

In that case, we can instead prefetch the query in the parent. The simplest way to do this is to use a query but ignore the result:

[//]: # 'ExampleParentComponent'

```tsx
function Article({ id }) {
  const { data: articleData, isPending } = useQuery({
    queryKey: ['article', id],
    queryFn: getArticleById,
  })

  // Prefetch
  useQuery({
    queryKey: ['article-comments', id],
    queryFn: getArticleCommentsById,
    // Optional optimization to avoid rerenders when this query changes:
    notifyOnChangeProps: [],
  })

  if (isPending) {
    return 'Loading article...'
  }

  return (
    <>
      <ArticleHeader articleData={articleData} />
      <ArticleBody articleData={articleData} />
      <Comments id={id} />
    </>
  )
}

function Comments({ id }) {
  const { data, isPending } = useQuery({
    queryKey: ['article-comments', id],
    queryFn: getArticleCommentsById,
  })

  ...
}
```

[//]: # 'ExampleParentComponent'

This starts fetching `'article-comments'` immediately and flattens the waterfall:

```
1. |> getArticleById()
1. |> getArticleCommentsById()
```

[//]: # 'Suspense'

If you want to prefetch together with Suspense, you will have to do things a bit differently. You can't use `useSuspenseQueries` to prefetch, since the prefetch would block the component from rendering. You also can not use `useQuery` for the prefetch, because that wouldn't start the prefetch until after suspenseful query had resolved. For this scenario, you can use the [`usePrefetchQuery`](../reference/usePrefetchQuery) or the [`usePrefetchInfiniteQuery`](../reference/usePrefetchInfiniteQuery) hooks available in the library.

You can now use `useSuspenseQuery` in the component that actually needs the data. You _might_ want to wrap this later component in its own `<Suspense>` boundary so the "secondary" query we are prefetching does not block rendering of the "primary" data.

```tsx
function ArticleLayout({ id }) {
  usePrefetchQuery({
    queryKey: ['article-comments', id],
    queryFn: getArticleCommentsById,
  })

  return (
    <Suspense fallback="Loading article">
      <Article id={id} />
    </Suspense>
  )
}

function Article({ id }) {
  const { data: articleData, isPending } = useSuspenseQuery({
    queryKey: ['article', id],
    queryFn: getArticleById,
  })

  ...
}
```

Another way is to prefetch inside of the query function. This makes sense if you know that every time an article is fetched it's very likely comments will also be needed. For this, we'll use `queryClient.prefetchQuery`:

```tsx
const queryClient = useQueryClient()
const { data: articleData, isPending } = useQuery({
  queryKey: ['article', id],
  queryFn: (...args) => {
    queryClient.prefetchQuery({
      queryKey: ['article-comments', id],
      queryFn: getArticleCommentsById,
    })

    return getArticleById(...args)
  },
})
```

Prefetching in an effect also works, but note that if you are using `useSuspenseQuery` in the same component, this effect wont run until _after_ the query finishes which might not be what you want.

```tsx
const queryClient = useQueryClient()

useEffect(() => {
  queryClient.prefetchQuery({
    queryKey: ['article-comments', id],
    queryFn: getArticleCommentsById,
  })
}, [queryClient, id])
```

To recap, if you want to prefetch a query during the component lifecycle, there are a few different ways to do it, pick the one that suits your situation best:

- Prefetch before a suspense boundary using `usePrefetchQuery` or `usePrefetchInfiniteQuery` hooks
- Use `useQuery` or `useSuspenseQueries` and ignore the result
- Prefetch inside the query function
- Prefetch in an effect

Let's look at a slightly more advanced case next.

[//]: # 'Suspense'

### Dependent Queries & Code Splitting

Sometimes we want to prefetch conditionally, based on the result of another fetch. Consider this example borrowed from the [Performance & Request Waterfalls guide](./request-waterfalls):

[//]: # 'ExampleConditionally1'

```tsx
// This lazy loads the GraphFeedItem component, meaning
// it wont start loading until something renders it
const GraphFeedItem = React.lazy(() => import('./GraphFeedItem'))

function Feed() {
  const { data, isPending } = useQuery({
    queryKey: ['feed'],
    queryFn: getFeed,
  })

  if (isPending) {
    return 'Loading feed...'
  }

  return (
    <>
      {data.map((feedItem) => {
        if (feedItem.type === 'GRAPH') {
          return <GraphFeedItem key={feedItem.id} feedItem={feedItem} />
        }

        return <StandardFeedItem key={feedItem.id} feedItem={feedItem} />
      })}
    </>
  )
}

// GraphFeedItem.tsx
function GraphFeedItem({ feedItem }) {
  const { data, isPending } = useQuery({
    queryKey: ['graph', feedItem.id],
    queryFn: getGraphDataById,
  })

  ...
}
```

[//]: # 'ExampleConditionally1'

As noted over in that guide, this example leads to the following double request waterfall:

```
1. |> getFeed()
2.   |> JS for <GraphFeedItem>
3.     |> getGraphDataById()
```

If we can not restructure our API so `getFeed()` also returns the `getGraphDataById()` data when necessary, there is no way to get rid of the `getFeed->getGraphDataById` waterfall, but by leveraging conditional prefetching, we can at least load the code and data in parallel. Just like described above, there are multiple ways to do this, but for this example, we'll do it in the query function:

[//]: # 'ExampleConditionally2'

```tsx
function Feed() {
  const queryClient = useQueryClient()
  const { data, isPending } = useQuery({
    queryKey: ['feed'],
    queryFn: async (...args) => {
      const feed = await getFeed(...args)

      for (const feedItem of feed) {
        if (feedItem.type === 'GRAPH') {
          queryClient.prefetchQuery({
            queryKey: ['graph', feedItem.id],
            queryFn: getGraphDataById,
          })
        }
      }

      return feed
    }
  })

  ...
}
```

[//]: # 'ExampleConditionally2'

This would load the code and data in parallel:

```
1. |> getFeed()
2.   |> JS for <GraphFeedItem>
2.   |> getGraphDataById()
```

There is a tradeoff however, in that the code for `getGraphDataById` is now included in the parent bundle instead of in `JS for <GraphFeedItem>` so you'll need to determine what's the best performance tradeoff on a case by case basis. If `GraphFeedItem` are likely, it's probably worth to include the code in the parent. If they are exceedingly rare, it's probably not.

[//]: # 'Router'

## Router Integration

Because data fetching in the component tree itself can easily lead to request waterfalls and the different fixes for that can be cumbersome as they accumulate throughout the application, an attractive way to do prefetching is integrating it at the router level.

In this approach, you explicitly declare for each _route_ what data is going to be needed for that component tree, ahead of time. Because Server Rendering has traditionally needed all data to be loaded before rendering starts, this has been the dominating approach for SSR'd apps for a long time. This is still a common approach and you can read more about it in the [Server Rendering & Hydration guide](./ssr).

For now, let's focus on the client side case and look at an example of how you can make this work with [Tanstack Router](https://tanstack.com/router). These examples leave out a lot of setup and boilerplate to stay concise, you can check out a [full React Query example](https://tanstack.com/router/v1/docs/framework/react/examples/basic-react-query-file-based) over in the [Tanstack Router docs](https://tanstack.com/router/v1/docs).

When integrating at the router level, you can choose to either _block_ rendering of that route until all data is present, or you can start a prefetch but not await the result. That way, you can start rendering the route as soon as possible. You can also mix these two approaches and await some critical data, but start rendering before all the secondary data has finished loading. In this example, we'll configure an `/article` route to not render until the article data has finished loading, as well as start prefetching comments as soon as possible, but not block rendering the route if comments haven't finished loading yet.

```tsx
const queryClient = new QueryClient()
const routerContext = new RouterContext()
const rootRoute = routerContext.createRootRoute({
  component: () => { ... }
})

const articleRoute = new Route({
  getParentRoute: () => rootRoute,
  path: 'article',
  beforeLoad: () => {
    return {
      articleQueryOptions: { queryKey: ['article'], queryFn: fetchArticle },
      commentsQueryOptions: { queryKey: ['comments'], queryFn: fetchComments },
    }
  },
  loader: async ({
    context: { queryClient },
    routeContext: { articleQueryOptions, commentsQueryOptions },
  }) => {
    // Fetch comments asap, but don't block
    queryClient.prefetchQuery(commentsQueryOptions)

    // Don't render the route at all until article has been fetched
    await queryClient.prefetchQuery(articleQueryOptions)
  },
  component: ({ useRouteContext }) => {
    const { articleQueryOptions, commentsQueryOptions } = useRouteContext()
    const articleQuery = useQuery(articleQueryOptions)
    const commentsQuery = useQuery(commentsQueryOptions)

    return (
      ...
    )
  },
  errorComponent: () => 'Oh crap!',
})
```

Integration with other routers is also possible, see the [React Router example](../../examples/react-router) for another demonstration.

[//]: # 'Router'

## Manually Priming a Query

If you already have the data for your query synchronously available, you don't need to prefetch it. You can just use the [Query Client's `setQueryData` method](../../../reference/QueryClient#queryclientsetquerydata) to directly add or update a query's cached result by key.

[//]: # 'ExampleManualPriming'

```tsx
queryClient.setQueryData(['todos'], todos)
```

[//]: # 'ExampleManualPriming'
[//]: # 'Materials'

## Further reading

For a deep-dive on how to get data into your Query Cache before you fetch, have a look at [#17: Seeding the Query Cache](../community/tkdodos-blog#17-seeding-the-query-cache) from the Community Resources.

Integrating with Server Side routers and frameworks is very similar to what we just saw, with the addition that the data has to passed from the server to the client to be hydrated into the cache there. To learn how, continue on to the [Server Rendering & Hydration guide](./ssr).

[//]: # 'Materials'
