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

function useFooQuery(id) {
  return useQuery({
    queryKey: ['get', id],
    queryFn: () => Api.get(`/foo/${id}`),
  })
}
```

Examples of **correct** code for this rule:

```tsx
/* eslint "@tanstack/query/prefer-query-options": "error" */

function getFooOptions(id) {
  return queryOptions({
    queryKey: ['get', id],
    queryFn: () => Api.get(`/foo/${id}`),
  })
}

function Component({ id }) {
  const query = useQuery(getFooOptions(id))
  // ...
}
```

```tsx
/* eslint "@tanstack/query/prefer-query-options": "error" */

function getFooOptions(id) {
  return queryOptions({
    queryKey: ['get', id],
    queryFn: () => Api.get(`/foo/${id}`),
  })
}

function useFooQuery(id) {
  return useQuery({ ...getFooOptions(id), select: (data) => data.foo })
}
```

The rule also enforces reusing `queryKey` from a `queryOptions` result instead of typing it manually in `QueryClient` methods or filters.

Examples of **incorrect** `queryKey` references for this rule:

```tsx
/* eslint "@tanstack/query/prefer-query-options": "error" */

function todoOptions(id) {
  return queryOptions({
    queryKey: ['todo', id],
    queryFn: () => api.getTodo(id),
  })
}

function Component({ id }) {
  const queryClient = useQueryClient()
  return queryClient.getQueryData(['todo', id])
}
```

```tsx
/* eslint "@tanstack/query/prefer-query-options": "error" */

function todoOptions(id) {
  return queryOptions({
    queryKey: ['todo', id],
    queryFn: () => api.getTodo(id),
  })
}

function Component({ id }) {
  const queryClient = useQueryClient()
  return queryClient.invalidateQueries({ queryKey: ['todo', id] })
}
```

Examples of **correct** `queryKey` references for this rule:

```tsx
/* eslint "@tanstack/query/prefer-query-options": "error" */

function todoOptions(id) {
  return queryOptions({
    queryKey: ['todo', id],
    queryFn: () => api.getTodo(id),
  })
}

function Component({ id }) {
  const queryClient = useQueryClient()
  return queryClient.getQueryData(todoOptions(id).queryKey)
}
```

```tsx
/* eslint "@tanstack/query/prefer-query-options": "error" */

function todoOptions(id) {
  return queryOptions({
    queryKey: ['todo', id],
    queryFn: () => api.getTodo(id),
  })
}

function Component({ id }) {
  const queryClient = useQueryClient()
  return queryClient.invalidateQueries({ queryKey: todoOptions(id).queryKey })
}
```

## When Not To Use It

If you do not want to enforce the use of `queryOptions` in your codebase, you will not need this rule.

## Attributes

- [x] ✅ Recommended (strict)
- [ ] 🔧 Fixable
