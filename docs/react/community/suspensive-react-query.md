---
id: suspensive-react-query
title: Suspensive React Query
---

Typesafe useQuery, useInfiniteQuery with default suspense option.

Use @suspensive/react-query, delegate loading and error handling to the outside of the component with useSuspenseQuery and useSuspenseInfiniteQuery, and focus on success inside the component.

You don't even need to use the isSuccess flag.

## Installation
You can install @suspensive/react-query via [NPM](https://www.npmjs.com/package/@suspensive/react-query).

```bash
$ npm i @suspensive/react @suspensive/react-query
# or
$ pnpm add @suspensive/react @suspensive/react-query
# or
$ yarn add @suspensive/react @suspensive/react-query
```

### Motivation

If you turn suspense mode on in @tanstack/react-query, You can use useQuery with Suspense and ErrorBoundary.

```tsx
import { useQuery } from '@tanstack/react-query'

const Example = () => {
  const query = useQuery(queryKey, queryFn, {
    suspense: true,
  })

  query.data // TData | undefined

  if (query.isSuccess) {
    query.data // TData
  }
}
```

Typically query.data will be `TData | undefined` like this code example.
But actual useQuery's return type:query.data will be always fulfilled because of [Suspense](https://suspensive.org/docs/react/src/Suspense.i18n) and [ErrorBoundary](https://suspensive.org/docs/react/src/ErrorBoundary.i18n) as parent of this component.

This is why @suspensive/react-query provide **useSuspenseQuery**

## useSuspenseQuery

Return type of this hook have no isLoading, isError property. because Suspense and ErrorBoundary will guarantee this hook's data.

In addition, this hook's options have default suspense: true. and you can provide new options to this hook like useQuery of @tanstack/react-query.

```tsx
import { useSuspenseQuery } from '@suspensive/react-query'

const Example = () => {
  const query = useSuspenseQuery(queryKey, queryFn, options) // suspense:true is default.

  // No need to do type narrowing by isSuccess
  query.data // TData
}
```

### Concentrate on only Success

Now, we can concentrate component as any fetching will be always success in component.

Check the complete documentation on [GitHub](https://github.com/suspensive/react).
