---
id: useSuspenseQuery
title: useSuspenseQuery
---

```tsx
const result = useSuspenseQuery(options)
```

**Options**

The same as for [useQuery](../reference/useQuery), except for:
- `suspense`
- `throwOnError`
- `enabled`
- `placeholderData`

**Returns**

Same object as [useQuery](../reference/useQuery), except that:
- `data` is guaranteed to be defined
- `isPlaceholderData` is missing
- `status` is always `success`
  - the derived flags are set accordingly.
