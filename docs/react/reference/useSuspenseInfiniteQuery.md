---
id: useSuspenseInfiniteQuery
title: useSuspenseInfiniteQuery
---

```tsx
const result = useSuspenseInfiniteQuery(options)
```

**Options**

The same as for [useInfiniteQuery](../reference/useInfiniteQuery), except for:
- `suspense`
- `throwOnError`
- `enabled`
- `placeholderData`

**Returns**

Same object as [useInfiniteQuery](../reference/useInfiniteQuery), except that:
- `data` is guaranteed to be defined
- `isPlaceholderData` is missing
- `status` is always `success`
  - the derived flags are set accordingly.
