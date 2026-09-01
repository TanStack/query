---
id: useSuspenseInfiniteQuery
title: useSuspenseInfiniteQuery
---

```tsx
const result = useSuspenseInfiniteQuery(options)
```

**Options**

The same as for [useInfiniteQuery](./useInfiniteQuery.md), except for:

- `throwOnError`
- `enabled`

**Returns**

Same object as [useInfiniteQuery](./useInfiniteQuery.md), except that:

- `data` is guaranteed to be defined
- `status` is either `success` or `error`
  - the derived flags are set accordingly.

When `placeholderData` is defined, the result has `isPlaceholderData: true` until the Query returns its data.

**Caveat**

[Cancellation](../guides/query-cancellation.md) does not work.
