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

## When Not To Use It

If you set the `notifyOnChangeProps` options manually, you can disable this rule.
Since you are not using tracked queries, you are responsible for specifying which props should trigger a re-render.

## Attributes

- [x] ✅ Recommended
- [ ] 🔧 Fixable
