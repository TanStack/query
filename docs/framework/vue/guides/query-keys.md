---
id: query-keys
title: Query Keys
ref: docs/framework/react/guides/query-keys.md
---

[//]: # 'Example5'

```js
function useTodos(todoId) {
  const queryKey = ['todos', todoId]
  return useQuery({
    queryKey,
    queryFn: () => fetchTodoById(todoId.value),
  })
}
```

[//]: # 'Example5'
