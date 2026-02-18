---
id: prefetching
title: Prefetching & Router Integration
ref: docs/framework/react/guides/prefetching.md
---

[//]: # 'ExampleComponent'

```tsx
import { Switch, Match } from 'solid-js'

function Article(props) {
  const articleQuery = useQuery(() => ({
    queryKey: ['article', props.id],
    queryFn: getArticleById,
  }))

  return (
    <Switch>
      <Match when={articleQuery.isPending}>
        Loading article...
      </Match>
      <Match when={articleQuery.isSuccess}>
        <ArticleHeader articleData={articleQuery.data} />
        <ArticleBody articleData={articleQuery.data} />
        <Comments id={props.id} />
      </Match>
    </Switch>
  )
}

function Comments(props) {
  const commentsQuery = useQuery(() => ({
    queryKey: ['article-comments', props.id],
    queryFn: getArticleCommentsById,
  }))

  ...
}
```

[//]: # 'ExampleComponent'
[//]: # 'ExampleParentComponent'

```tsx
import { Switch, Match } from 'solid-js'

function Article(props) {
  const articleQuery = useQuery(() => ({
    queryKey: ['article', props.id],
    queryFn: getArticleById,
  }))

  // Prefetch
  useQuery(() => ({
    queryKey: ['article-comments', props.id],
    queryFn: getArticleCommentsById,
    // Optional optimization to avoid rerenders when this query changes:
    notifyOnChangeProps: [],
  }))

  return (
    <Switch>
      <Match when={articleQuery.isPending}>
        Loading article...
      </Match>
      <Match when={articleQuery.isSuccess}>
        <ArticleHeader articleData={articleQuery.data} />
        <ArticleBody articleData={articleQuery.data} />
        <Comments id={props.id} />
      </Match>
    </Switch>
  )
}

function Comments(props) {
  const commentsQuery = useQuery(() => ({
    queryKey: ['article-comments', props.id],
    queryFn: getArticleCommentsById,
  }))

  ...
}
```

[//]: # 'ExampleParentComponent'
[//]: # 'Suspense'

Another way is to prefetch inside of the query function. This makes sense if you know that every time an article is fetched it's very likely comments will also be needed. For this, we'll use `queryClient.prefetchQuery`:

```tsx
const queryClient = useQueryClient()
const articleQuery = useQuery(() => ({
  queryKey: ['article', id],
  queryFn: (...args) => {
    queryClient.prefetchQuery({
      queryKey: ['article-comments', id],
      queryFn: getArticleCommentsById,
    })

    return getArticleById(...args)
  },
}))
```

Prefetching in an effect also works:

```tsx
import { createEffect } from 'solid-js'

const queryClient = useQueryClient()

createEffect(() => {
  queryClient.prefetchQuery({
    queryKey: ['article-comments', id],
    queryFn: getArticleCommentsById,
  })
})
```

To recap, if you want to prefetch a query during the component lifecycle, there are a few different ways to do it, pick the one that suits your situation best:

- Use `useQuery` and ignore the result
- Prefetch inside the query function
- Prefetch in an effect

Let's look at a slightly more advanced case next.

[//]: # 'Suspense'
[//]: # 'ExampleConditionally1'

```tsx
import { lazy, Switch, Match, For } from 'solid-js'

// This lazy loads the GraphFeedItem component, meaning
// it wont start loading until something renders it
const GraphFeedItem = lazy(() => import('./GraphFeedItem'))

function Feed() {
  const feedQuery = useQuery(() => ({
    queryKey: ['feed'],
    queryFn: getFeed,
  }))

  return (
    <Switch>
      <Match when={feedQuery.isPending}>
        Loading feed...
      </Match>
      <Match when={feedQuery.isSuccess}>
        <For each={feedQuery.data}>
          {(feedItem) => {
            if (feedItem.type === 'GRAPH') {
              return <GraphFeedItem feedItem={feedItem} />
            }
            return <StandardFeedItem feedItem={feedItem} />
          }}
        </For>
      </Match>
    </Switch>
  )
}

// GraphFeedItem.tsx
function GraphFeedItem(props) {
  const graphQuery = useQuery(() => ({
    queryKey: ['graph', props.feedItem.id],
    queryFn: getGraphDataById,
  }))

  ...
}
```

[//]: # 'ExampleConditionally1'
[//]: # 'ExampleConditionally2'

```tsx
function Feed() {
  const queryClient = useQueryClient()
  const feedQuery = useQuery(() => ({
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
  }))

  ...
}
```

[//]: # 'ExampleConditionally2'
[//]: # 'Router'

## Router Integration

Because data fetching in the component tree itself can easily lead to request waterfalls and the different fixes for that can be cumbersome as they accumulate throughout the application, an attractive way to do prefetching is integrating it at the router level.

In this approach, you explicitly declare for each _route_ what data is going to be needed for that component tree, ahead of time. Because Server Rendering has traditionally needed all data to be loaded before rendering starts, this has been the dominating approach for SSR'd apps for a long time. This is still a common approach and you can read more about it in the [Server Rendering & Hydration guide](./ssr.md).

For now, let's focus on the client side case and look at an example of how you can make this work with [TanStack Router](https://tanstack.com/router). These examples leave out a lot of setup and boilerplate to stay concise, you can check out a [full Solid Query example](https://tanstack.com/router/latest/docs/framework/solid/examples/basic-solid-query-file-based) over in the [TanStack Router docs](https://tanstack.com/router/latest/docs).

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
    const articleQuery = useQuery(() => articleQueryOptions)
    const commentsQuery = useQuery(() => commentsQueryOptions)

    return (
      ...
    )
  },
  errorComponent: () => 'Oh crap!',
})
```

Integration with other routers is also possible.

[//]: # 'Router'
