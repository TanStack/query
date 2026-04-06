---
id: infiniteQueryOptions
title: infiniteQueryOptions
---

```tsx
infiniteQueryOptions({
  queryKey,
  ...options,
})
```

**Options**

You can generally pass everything to `infiniteQueryOptions` that you can also pass to [`useInfiniteQuery`](./useInfiniteQuery.md). These options can be shared across hooks and imperative APIs such as `queryClient.infiniteQuery`.

Options like `select` and `enabled` keep working when you pass the result to `queryClient.infiniteQuery`, because `infiniteQuery()` honors the same imperative query semantics. Legacy methods like `fetchInfiniteQuery` and `prefetchInfiniteQuery` ignore `select` and `enabled`, even though TypeScript still accepts those excess properties.

- `queryKey: QueryKey`
  - **Required**
  - The query key to generate options for.

See [useInfiniteQuery](./useInfiniteQuery.md) for more information.
