---
id: suspensive-react-query
title: Suspensive React Query
---

Typesafe useQuery, useQueries, useInfiniteQuery with default suspense option.

Use @suspensive/react-query, delegate loading and error handling to the outside of the component with [useSuspenseQuery](https://suspensive.org/docs/react-query/useSuspenseQuery), [useSuspenseQueries](https://suspensive.org/docs/react-query/useSuspenseQueries) and [useSuspenseInfiniteQuery](https://suspensive.org/docs/react-query/useSuspenseInfiniteQuery), and focus on success inside the component.

You don't even need to use the isSuccess flag.

## useSuspenseQuery, useSuspenseQueries, useSuspenseInfiniteQuery is Official API now! (from v5)

From @tanstack/react-query v5 provides [official public hook apis for suspense](https://tanstack.com/query/v5/docs/react/guides/suspense) like @suspensive/react-query's hooks. so if you're using @tanstack/react-query v5, Migrate our hooks to hooks of official @tanstack/react-query please.

### But if you are still using @tanstack/react-query v4 because of unavoidable reasons

There is lot of projects can't update our @tanstack/react-query version to v5.
If you want to experience early useSuspenseQuery, useSuspenseQueries, useSuspenseInfiniteQuery in also v4, You can use them with @suspensive/react-query first

You can install @suspensive/react-query via [NPM](https://www.npmjs.com/package/@suspensive/react-query).

```bash
$ npm i @suspensive/react-query
# or
$ pnpm add @suspensive/react-query
# or
$ yarn add @suspensive/react-query
```

### Motivation

If you turn suspense mode on in @tanstack/react-query v4, You can use useQuery with Suspense and ErrorBoundary.

```tsx
import { useQuery } from '@tanstack/react-query' // this is v4

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
import { useSuspenseQuery } from '@suspensive/react-query' // this is v4

const Example = () => {
  const query = useSuspenseQuery({
    queryKey,
    queryFn,
  }) // suspense:true is default. @tanstack/react-query v5 also removed useQuery's suspense option to promote using useSuspenseQuery, so if you want to migrate @tanstack/react-query with using suspense gradually, @suspensive/react-query will be good choice

  // No need to do type narrowing by isSuccess
  query.data // TData
}
```

### Concentrate on only Success

Now, we can concentrate component as any fetching will be always success in component.

### useSuspenseQuery is Official API now! (from v5)

@suspensive/react-query provides not only [useSuspenseQuery](https://suspensive.org/docs/react-query/useSuspenseQuery), also [useSuspenseQueries](https://suspensive.org/docs/react-query/useSuspenseQueries), [useSuspenseInfiniteQuery](https://suspensive.org/docs/react-query/useSuspenseInfiniteQuery). From @tanstack/react-query v5 provides [official public hook apis for suspense](https://tanstack.com/query/v5/docs/react/guides/suspense) like @suspensive/react-query's hooks. If want to use them early in v4, use this @suspensive/react-query first.

Check the complete documentation on [Suspensive Official Docs Site](https://suspensive.org/) and also welcome Pull Request on [Suspensive GitHub](https://github.com/suspensive/react)
