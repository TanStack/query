---
id: useSuspenseQueries
title: useSuspenseQueries
---

```tsx
const result = useSuspenseQueries(options)
```

**Options**

The same as for [useQueries](../reference/useQueries), except that each `query` can't have:

- `suspense`
- `throwOnError`
- `enabled`
- `placeholderData`

**Returns**

Same structure as [useQueries](../reference/useQueries), except that for each `query`:

- `data` is guaranteed to be defined
- `isPlaceholderData` is missing
- `status` is always `success`
  - the derived flags are set accordingly.
