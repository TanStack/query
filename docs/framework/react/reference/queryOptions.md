---
id: queryOptions
title: queryOptions
---

```tsx
queryOptions({
  queryKey,
  ...options,
})
```

**Options**

You can generally pass everything to `queryOptions` that you can also pass to [`useQuery`](../useQuery.md). Some options will have no effect when then forwarded to a function like `queryClient.prefetchQuery`, but TypeScript will still be fine with those excess properties.

- `queryKey: QueryKey`
  - **Required**
  - The query key to generate options for.
- `experimental_prefetchInRender?: boolean`
  - Optional
  - Defaults to `false`
  - When set to `true`, queries will be prefetched during render, which can be useful for certain optimization scenarios
  - Needs to be turned on for the experimental `useQuery().promise` functionality

[//]: # 'Materials'

## Further reading

To learn more about `QueryOptions`, have a look at [The Query Options API](../../community/tkdodos-blog.md#24-the-query-options-api) from the Community Resources.

[//]: # 'Materials'
