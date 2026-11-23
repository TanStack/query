---
id: no-rest-destructuring
title: Disallow object rest destructuring on query results
---

Use object rest destructuring on query results automatically subscribes to every field of the query result, which may cause unnecessary re-renders.
This makes sure that you only subscribe to the fields that you actually need.

## Rule Details

Examples of **incorrect** code for this rule:

```tsx
/* eslint "@tanstack/query/no-rest-destructuring": "warn" */

const useTodos = () => {
  const { data: todos, ...rest } = useQuery({
    queryKey: ['todos'],
    queryFn: () => api.getTodos(),
  })
  return { todos, ...rest }
}
```

Examples of **correct** code for this rule:

```tsx
const todosQuery = useQuery({
  queryKey: ['todos'],
  queryFn: () => api.getTodos(),
})

// normal object destructuring is fine
const { data: todos } = todosQuery
```

When [typed linting](https://typescript-eslint.io/getting-started/typed-linting/) is enabled, the rule also flags rest destructuring on custom hooks that return a TanStack Query result.

## When Not To Use It

You can disable this rule for queries that set `notifyOnChangeProps` to `'all'` or `'none'`. These modes skip property tracking.

## Attributes

- [x] ✅ Recommended
- [ ] 🔧 Fixable
