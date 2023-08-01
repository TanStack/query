---
id: useSuspenseInfiniteQuery
title: useSuspenseInfiniteQuery
---

```tsx
const [data, query] = useSuspenseInfiniteQuery(options)
```

**Options**

The same as for [useInfiniteQuery](../reference/useInfiniteQuery), except for:
- `suspense`
- `throwOnError`
- `enabled`
- `placeholderData`

**Returns**

A tuple of `[data, query]`, where:
- `data` is the query data
- `query` is the same query object as returned by [useInfiniteQuery](../reference/useInfiniteQuery), except for:
  - `isPlaceholderData` is missing
  - `status` is always `success`
    - the derived flags are set accordingly.
