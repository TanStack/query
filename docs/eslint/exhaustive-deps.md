---
id: exhaustive-deps
title: Exhaustive dependencies for query keys
---

Query keys should be seen like a dependency array to your query function: Every variable that is used inside the queryFn should be added to the query key.
This makes sure that queries are cached independently and that queries are refetched automatically when the variables changes.

## Rule Details

Examples of **incorrect** code for this rule:

```tsx
/* eslint "@tanstack/query/exhaustive-deps": "error" */

useQuery({
  queryKey: ['todo'],
  queryFn: () => api.getTodo(todoId),
})

const todoQueries = {
  detail: (id) => ({ queryKey: ['todo'], queryFn: () => api.getTodo(id) }),
}
```

Examples of **correct** code for this rule:

```tsx
useQuery({
  queryKey: ['todo', todoId],
  queryFn: () => api.getTodo(todoId),
})

const todoQueries = {
  detail: (id) => ({ queryKey: ['todo', id], queryFn: () => api.getTodo(id) }),
}
```

## When Not To Use It

If you don't care about the rules of the query keys, then you will not need this rule.

## Attributes

- [x] ✅ Recommended
- [x] 🔧 Fixable
