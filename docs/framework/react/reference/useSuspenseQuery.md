---
id: useSuspenseQuery
title: useSuspenseQuery
---

```tsx
const result = useSuspenseQuery(options)
```

**Options**

The same as for [useQuery](./useQuery.md), except for:

- `throwOnError`
- `enabled`

**Returns**

Same object as [useQuery](./useQuery.md), except that:

- `data` is guaranteed to be defined
- `status` is either `success` or `error`
  - the derived flags are set accordingly.

**Caveat**

[Cancellation](../guides/query-cancellation.md) does not work.
