---
id: suspensive-react-query
title: Suspensive React Query
---

Typesafe useQuery, useQueries, useInfiniteQuery with default suspense option.

Use @suspensive/react-query, delegate loading and error handling to the outside of the component with [useSuspenseQuery](https://suspensive.org/docs/react-query/useSuspenseQuery), [useSuspenseQueries](https://suspensive.org/docs/react-query/useSuspenseQueries) and [useSuspenseInfiniteQuery](https://suspensive.org/docs/react-query/useSuspenseInfiniteQuery), and focus on success inside the component.

You don't even need to use the isSuccess flag.

## Installation

You can install @suspensive/react-query via [NPM](https://www.npmjs.com/package/@suspensive/react-query).

```bash
$ npm i @suspensive/react-query
# or
$ pnpm add @suspensive/react-query
# or
$ yarn add @suspensive/react-query
```

### Motivation

If you turn suspense mode on in @tanstack/react-query, You can use useQuery with Suspense and ErrorBoundary.

```tsx
import { useQuery } from '@tanstack/react-query'

const Example = () => {
  const query = useQuery({
    queryKey,
    queryFn,
    suspense: true,
  })

  query.data // TData | undefined

  if (query.isSuccess) {
    query.data // TData
  }
}
```

Typically query.data will be `TData | undefined` like this code example.
But actual useQuery's return type:query.data will be always fulfilled because of [Suspense](https://suspensive.org/docs/react/Suspense) and [ErrorBoundary](https://suspensive.org/docs/react/ErrorBoundary) as parent of this component.

This is why @suspensive/react-query provide **useSuspenseQuery**

## useSuspenseQuery

Return type of this hook have no isLoading, isError property. because Suspense and ErrorBoundary will guarantee this hook's data.

In addition, this hook's options have default suspense: true. and you can provide new options to this hook like useQuery of @tanstack/react-query.

```tsx
import { useSuspenseQuery } from '@suspensive/react-query'

const Example = () => {
  const query = useSuspenseQuery({
    queryKey,
    queryFn,
  }) // suspense:true is default.

  // No need to do type narrowing by isSuccess
  query.data // TData
}
```

### Concentrate on only Success

Now, we can concentrate component as any fetching will be always success in component.

## queryOptions

Tkdodo, The maintainer of TanStack Query explains well why this interface is needed in [video explaining queryOptions in TanStack Query v5](https://youtu.be/bhE3wuB_TuA?feature=shared&t=1697).
You can also use queryOptions in TanStack Query v4.

1. QueryKey management becomes easier by processing queryKey and queryFn together.
2. You can remove unnecessary custom query hooks. This is because they can all be used directly in `useQuery`, `useQueries` of TanStack Query v4.
3. TanStack Query v5 already supports queryOptions. This Suspensive React Query's `queryOptions` will make migration from TanStack Query v4 to TanStack Query v5 easier.

```tsx
import { queryOptions } from '@suspensive/react-query'
import { useQuery, useQueries, useQueryClient } from '@tanstack/react-query'

const postQueryOptions = (postId) =>
  queryOptions({
    queryKey: ['posts', postId] as const,
    queryFn: ({
      queryKey: [, postId], // You can use queryKey.
    }) => fetch(`https://example.com/posts/${postId}`),
  })

// No need to create custom query hooks.
// You can use queryOptions directly in useQuery, useQueries.
const post1Query = useQuery(postQueryOptions(1))

const [post1Query, post2Query] = useQueries({
  queries: [
    postQueryOptions(1),
    { ...postQueryOptions(2), refetchInterval: 2000 },
  ],
})

// You can easily use queryKey and queryFn in queryClient's methods.
const queryClient = useQueryClient()
queryClient.refetchQueries(postQueryOptions(1))
queryClient.prefetchQuery(postQueryOptions(1))
queryClient.invalidateQueries(postQueryOptions(1))
queryClient.fetchQuery(postQueryOptions(1))
queryClient.resetQueries(postQueryOptions(1))
queryClient.cancelQueries(postQueryOptions(1))
```

### Using queryOptions in TanStack Query v4

> "One of the best ways to share queryKey and queryFn between multiple places, yet keep them co-located to one another, is to use the queryOptions helper." For more details, you can refer to the [TanStack Query v5 Official Docs - Query Options](https://tanstack.com/query/v5/docs/framework/react/guides/query-options).

You can use queryOptions in TanStack Query v4 just like in TanStack Query v5, and it is fully compatible with the TanStack Query v4 API.

### useSuspenseQuery is Official API now! (from v5)

@suspensive/react-query provides not only [useSuspenseQuery](https://suspensive.org/docs/react-query/useSuspenseQuery), also [useSuspenseQueries](https://suspensive.org/docs/react-query/useSuspenseQueries), [useSuspenseInfiniteQuery](https://suspensive.org/docs/react-query/useSuspenseInfiniteQuery). From @tanstack/react-query v5 provides [official public hook apis for suspense](https://tanstack.com/query/v5/docs/react/guides/suspense) like @suspensive/react-query's hooks. If want to use them early in v4, use this @suspensive/react-query first.

Check the complete documentation on [Suspensive Official Docs Site](https://suspensive.org/) and also welcome Pull Request on [Suspensive GitHub](https://github.com/suspensive/react)
