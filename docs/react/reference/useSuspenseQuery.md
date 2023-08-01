---
id: useSuspenseQuery
title: useSuspenseQuery
---

```tsx
const [data, query] = useSuspenseQuery(options)
```

**Options**

The same as for [useQuery](../reference/useQuery), except for:
- `suspense`
- `throwOnError`
- `enabled`
- `placeholderData`

**Returns**

A tuple of `[data, query]`, where:
- `data` is the query data
- `query` is the same query object as returned by [useQuery](../reference/useQuery), except for:
  - `isPlaceholderData` is missing
  - `status` is always `success`
    - the derived flags are set accordingly.
