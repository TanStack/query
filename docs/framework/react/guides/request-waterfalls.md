---
id: request-waterfalls
title: Performance & Request Waterfalls
---

Application performance is a broad and complex area and while React Query can't make your APIs faster, there are still things to be mindful about in how you use React Query to ensure the best performance.

The biggest performance footgun when using React Query, or indeed any data fetching library that lets you fetch data inside of components, is request waterfalls. The rest of this page will explain what they are, how you can spot them and how you can restructure your application or APIs to avoid them.

The [Prefetching & Router Integration guide](./prefetching.md) builds on this and teaches you how to prefetch data ahead of time when it's not possible or feasible to restructure your application or APIs.

The [Server Rendering & Hydration guide](./ssr.md) teaches you how to prefetch data on the server and pass that data down to the client so you don't have to fetch it again.

The [Advanced Server Rendering guide](./advanced-ssr.md) further teaches you how to apply these patterns to Server Components and Streaming Server Rendering.

## What is a Request Waterfall?

A request waterfall is what happens when a request for a resource (code, css, images, data) does not start until _after_ another request for a resource has finished.

Consider a web page. Before you can load things like the CSS, JS etc, the browser first needs to load the markup. This is a request waterfall.

```
1. |-> Markup
2.   |-> CSS
2.   |-> JS
2.   |-> Image
```

If you fetch your CSS inside a JS file, you now have a double waterfall:

```
1. |-> Markup
2.   |-> JS
3.     |-> CSS
```

If that CSS uses a background image, it's a triple waterfall:

```
1. |-> Markup
2.   |-> JS
3.     |-> CSS
4.       |-> Image
```

The best way to spot and analyze your request waterfalls is usually by opening your browsers devtools "Network" tab.

Each waterfall represents at least one roundtrip to the server, unless the resource is locally cached (in practice, some of these waterfalls might represent more than one roundtrip because the browser needs to establish a connection which requires some back and forth, but let's ignore that here). Because of this, the negative effects of request waterfalls are highly dependent on the users latency. Consider the example of the triple waterfall, which actually represents 4 server roundtrips. With 250ms latency, which is not uncommon on 3g networks or in bad network conditions, we end up with a total time of 4\*250=1000ms **only counting latency**. If we were able to flatten that to the first example with only 2 roundtrips, we get 500ms instead, possibly loading that background image in half the time!

## Request Waterfalls & React Query

Now let's consider React Query. We'll focus on the case without Server Rendering first. Before we can even start making a query, we need to load the JS, so before we can show that data on the screen, we have a double waterfall:

```
1. |-> Markup
2.   |-> JS
3.     |-> Query
```

With this as a basis, let's look at a few different patterns that can lead to Request Waterfalls in React Query, and how to avoid them.

- Single Component Waterfalls / Serial Queries
- Nested Component Waterfalls
- Code Splitting

### Single Component Waterfalls / Serial Queries

When a single component first fetches one query, and then another, that's a request waterfall. This can happen when the second query is a [Dependent Query](./dependent-queries.md), that is, it depends on data from the first query when fetching:

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

While not always feasible, for optimal performance it's better to restructure your API so you can fetch both of these in a single query. In the example above, instead of first fetching `getUserByEmail` to be able to `getProjectsByUser`, introducing a new `getProjectsByUserEmail` query would flatten the waterfall.

> Another way to mitigate dependent queries without restructuring your API is to move the waterfall to the server where latency is lower. This is the idea behind Server Components which are covered in the [Advanced Server Rendering guide](./advanced-ssr.md).

Another example of serial queries is when you use React Query with Suspense:

```tsx
function App () {
  // The following queries will execute in serial, causing separate roundtrips to the server:
  const usersQuery = useSuspenseQuery({ queryKey: ['users'], queryFn: fetchUsers })
  const teamsQuery = useSuspenseQuery({ queryKey: ['teams'], queryFn: fetchTeams })
  const projectsQuery = useSuspenseQuery({ queryKey: ['projects'], queryFn: fetchProjects })

  // Note that since the queries above suspend rendering, no data
  // gets rendered until all of the queries finished
  ...
}
```

Note that with regular `useQuery` these would happen in parallel.

Luckily, this is easy to fix, by always using the hook `useSuspenseQueries` when you have multiple suspenseful queries in a component.

```tsx
const [usersQuery, teamsQuery, projectsQuery] = useSuspenseQueries({
  queries: [
    { queryKey: ['users'], queryFn: fetchUsers },
    { queryKey: ['teams'], queryFn: fetchTeams },
    { queryKey: ['projects'], queryFn: fetchProjects },
  ],
})
```

### Nested Component Waterfalls

Nested Component Waterfalls is when both a parent and a child component contains queries, and the parent does not render the child until its query is done. This can happen both with `useQuery` and `useSuspenseQuery`.

If the child renders conditionally based on the data in the parent, or if the child relies on some part of the result being passed down as a prop from the parent to make its query, we have a _dependent_ nested component waterfall.

Let's first look at an example where the child is **not** dependent on the parent.

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

Note that while `<Comments>` takes a prop `id` from the parent, that id is already available when the `<Article>` renders so there is no reason we could not fetch the comments at the same time as the article. In real world applications, the child might be nested far below the parent and these kinds of waterfalls are often trickier to spot and fix, but for our example, one way to flatten the waterfall would be to hoist the comments query to the parent instead:

```tsx
function Article({ id }) {
  const { data: articleData, isPending: articlePending } = useQuery({
    queryKey: ['article', id],
    queryFn: getArticleById,
  })

  const { data: commentsData, isPending: commentsPending } = useQuery({
    queryKey: ['article-comments', id],
    queryFn: getArticleCommentsById,
  })

  if (articlePending) {
    return 'Loading article...'
  }

  return (
    <>
      <ArticleHeader articleData={articleData} />
      <ArticleBody articleData={articleData} />
      {commentsPending ? (
        'Loading comments...'
      ) : (
        <Comments commentsData={commentsData} />
      )}
    </>
  )
}
```

The two queries will now fetch in parallel. Note that if you are using suspense, you'd want to combine these two queries into a single `useSuspenseQueries` instead.

Another way to flatten this waterfall would be to prefetch the comments in the `<Article>` component, or prefetch both of these queries at the router level on page load or page navigation, read more about this in the [Prefetching & Router Integration guide](./prefetching.md).

Next, let's look at a _Dependent Nested Component Waterfall_.

```tsx
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

function GraphFeedItem({ feedItem }) {
  const { data, isPending } = useQuery({
    queryKey: ['graph', feedItem.id],
    queryFn: getGraphDataById,
  })

  ...
}
```

The second query `getGraphDataById` is dependent on it's parent in two different ways. First of all, it doesn't ever happen unless the `feedItem` is a graph, and second, it needs an `id` from the parent.

```
1. |> getFeed()
2.   |> getGraphDataById()
```

In this example, we can't trivially flatten the waterfall by just hoisting the query to the parent, or even adding prefetching. Just like the dependent query example at the beginning of this guide, one option is to refactor our API to include the graph data in the `getFeed` query. Another more advanced solution is to leverage Server Components to move the waterfall to the server where latency is lower (read more about this in the [Advanced Server Rendering guide](./advanced-ssr.md)) but note that this can be a very big architectural change.

You can have good performance even with a few query waterfalls here and there, just know they are a common performance concern and be mindful about them. An especially insidious version is when Code Splitting is involved, let's take a look at this next.

### Code Splitting

Splitting an applications JS-code into smaller chunks and only loading the necessary parts is usually a critical step in achieving good performance. It does have a downside however, in that it often introduces request waterfalls. When that code split code also has a query inside it, this problem is worsened further.

Consider this a slightly modified version of the Feed example.

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

This example has a double waterfall, looking like this:

```
1. |> getFeed()
2.   |> JS for <GraphFeedItem>
3.     |> getGraphDataById()
```

But that's just looking at the code from the example, if we consider what the first page load of this page looks like, we actually have to complete 5 round trips to the server before we can render the graph!

```
1. |> Markup
2.   |> JS for <Feed>
3.     |> getFeed()
4.       |> JS for <GraphFeedItem>
5.         |> getGraphDataById()
```

Note that this looks a bit different when server rendering, we will explore that further in the [Server Rendering & Hydration guide](../ssr). Also note that it's not uncommon for the route that contains `<Feed>` to also be code split, which could add yet another hop.

In the code split case, it might actually help to hoist the `getGraphDataById` query to the `<Feed>` component and make it conditional, or add a conditional prefetch. That query could then be fetched in parallel with the code, turning the example part into this:

```
1. |> getFeed()
2.   |> getGraphDataById()
2.   |> JS for <GraphFeedItem>
```

This is very much a tradeoff however. You are now including the data fetching code for `getGraphDataById` in the same bundle as `<Feed>`, so evaluate what is best for your case. Read more about how to do this in the [Prefetching & Router Integration guide](../prefetching).

> The tradeoff between:
>
> - Include all data fetching code in the main bundle, even if we seldom use it
> - Put the data fetching code in the code split bundle, but with a request waterfall
>
> is not great and has been one of the motivations for Server Components. With Server Components, it's possible to avoid both, read more about how this applies to React Query in the [Advanced Server Rendering guide](../advanced-ssr).

## Summary and takeaways

Request Waterfalls are a very common and complex performance concern with many tradeoffs. There are many ways to accidentally introduce them into your application:

- Adding a query to a child, not realizing a parent already has a query
- Adding a query to a parent, not realizing a child already has a query
- Moving a component with descendants that has a query to a new parent with an ancestor that has a query
- Etc..

Because of this accidental complexity, it pays off to be mindful of waterfalls and regularly examine your application looking for them (a good way is to examine the Network tab every now and then!). You don't necessarily have to flatten them all to have good performance, but keep an eye out for the high impact ones.

In the next guide, we'll look at more ways to flatten waterfalls, by leveraging [Prefetching & Router Integration](./prefetching.md).
