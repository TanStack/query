---
id: prefer-query-options
title: Prefer the use of queryOptions
---

Separating `queryKey` and `queryFn` can cause unexpected runtime issues when the same query key is accidentally used with more than one `queryFn`. Wrapping them in `queryOptions` (or `infiniteQueryOptions`) co-locates the key and function, making queries safer and easier to reuse.

## Rule Details

Examples of **incorrect** code for this rule:

```tsx
/* eslint "@tanstack/query/prefer-query-options": "error" */

function Component({ id }) {
  const query = useQuery({
    queryKey: ['get', id],
    queryFn: () => Api.get(`/foo/${id}`),
  })
  // ...
}
```

```tsx
/* eslint "@tanstack/query/prefer-query-options": "error" */

function useFooQuery() {
  return useQuery({
    queryKey: ['get', id],
    queryFn: () => Api.get(`/foo/${id}`),
  })
}
```

Examples of **correct** code for this rule:

```tsx
/* eslint "@tanstack/query/prefer-query-options": "error" */

const options = queryOptions({
  queryKey: ['get', id],
  queryFn: () => Api.get(`/foo/${id}`),
})

function Component({ id }) {
  const query = useQuery(options)
  // ...
}
```

```tsx
/* eslint "@tanstack/query/prefer-query-options": "error" */

const options = queryOptions({
  queryKey: ['get', id],
  queryFn: () => Api.get(`/foo/${id}`),
})

function useFooQuery() {
  return useQuery({ ...options, select: (data) => data.foo })
}
```

The rule also enforces reusing `queryKey` from a `queryOptions` result instead of typing it manually in `QueryClient` methods or filters.

Examples of **incorrect** `queryKey` references for this rule:

```tsx
/* eslint "@tanstack/query/prefer-query-options": "error" */

const todoOptions = queryOptions({
  queryKey: ['todo', id],
  queryFn: () => api.getTodo(id),
})

queryClient.getQueryData(['todo', id])
```

```tsx
/* eslint "@tanstack/query/prefer-query-options": "error" */

const todoOptions = queryOptions({
  queryKey: ['todo', id],
  queryFn: () => api.getTodo(id),
})

queryClient.invalidateQueries({ queryKey: ['todo', id] })
```

Examples of **correct** `queryKey` references for this rule:

```tsx
/* eslint "@tanstack/query/prefer-query-options": "error" */

const todoOptions = queryOptions({
  queryKey: ['todo', id],
  queryFn: () => api.getTodo(id),
})

queryClient.getQueryData(todoOptions.queryKey)
```

```tsx
/* eslint "@tanstack/query/prefer-query-options": "error" */

const todoOptions = queryOptions({
  queryKey: ['todo', id],
  queryFn: () => api.getTodo(id),
})

queryClient.invalidateQueries({ queryKey: todoOptions.queryKey })
```

## When Not To Use It

If you do not want to enforce the use of `queryOptions` in your codebase, you will not need this rule.

## Attributes

- [x] ✅ Recommended (strict)
- [ ] 🔧 Fixable
