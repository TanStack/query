---
id: no-deprecated-options
title: Disallowing deprecated options
---

This rule warns about deprecated [`useQuery`](https://tanstack.com/query/v4/docs/reference/useQuery) options which will be removed in [TanStack Query v5](https://tanstack.com/query/v5/docs/react/guides/migrating-to-v5).

## Rule Details

Examples of **incorrect** code for this rule:

```tsx
/* eslint "@tanstack/query/no-deprecated-options": "error" */

useQuery({
  queryKey: ['todo', todoId],
  queryFn: () => api.getTodo(todoId),
  onSuccess: () => {},
})

useQuery({
  queryKey: ['todo', todoId],
  queryFn: () => api.getTodo(todoId),
  onError: () => {},
})

useQuery({
  queryKey: ['todo', todoId],
  queryFn: () => api.getTodo(todoId),
  onSettled: () => {},
})

useQuery({
  queryKey: ['todo', todoId],
  queryFn: () => api.getTodo(todoId),
  isDataEqual: (oldData, newData) => customCheck(oldData, newData),
})
```

Examples of **correct** code for this rule:

```tsx
useQuery({
  queryKey: ['todo', todoId],
  queryFn: () => api.getTodo(todoId),
})

useQuery({
  queryKey: ['todo', todoId],
  queryFn: () => api.getTodo(todoId),
  structuralSharing: (oldData, newData) =>
    customCheck(oldData, newData)
      ? oldData
      : replaceEqualDeep(oldData, newData),
})
```

## When Not To Use It

If you don't plan to upgrade to TanStack Query v5, then you will not need this rule.

## Attributes

- [x] ✅ Recommended
- [ ] 🔧 Fixable
