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
const Component = ({ todoId }) => {
  const todos = useTodos()
  useQuery({
    queryKey: ['todo', todos, todoId],
    queryFn: () => todos.getTodo(todoId),
  })
}
```

```tsx
const todos = createTodos()
const todoQueries = {
  detail: (id) => ({
    queryKey: ['todo', id],
    queryFn: () => todos.getTodo(id),
  }),
}
```

```tsx
// with { allowlist: { variables: ["todos"] }}
const Component = ({ todoId }) => {
  const todos = useTodos()
  useQuery({
    queryKey: ['todo', todoId],
    queryFn: () => todos.getTodo(todoId),
  })
}
```

```tsx
// with { allowlist: { types: ["TodosClient"] }}
class TodosClient { ... }
const Component = ({ todoId }) => {
  const todos: TodosClient = new TodosClient()
  useQuery({
    queryKey: ['todo', todoId],
    queryFn: () => todos.getTodo(todoId),
  })
}
```

### Options

- `allowlist.variables`: An array of variable names that should be ignored when checking dependencies
- `allowlist.types`: An array of TypeScript type names that should be ignored when checking dependencies

```json
{
  "@tanstack/query/exhaustive-deps": [
    "error",
    {
      "allowlist": {
        "variables": ["api", "config"],
        "types": ["ApiClient", "Config"]
      }
    }
  ]
}
```

## When Not To Use It

If you don't care about the rules of the query keys, then you will not need this rule.

## Attributes

- [x] ✅ Recommended
- [x] 🔧 Fixable
