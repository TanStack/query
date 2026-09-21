---
id: query-keys
title: Query Keys
ref: docs/framework/react/guides/query-keys.md
---

[//]: # 'Example5'

```ts
import type { Ref } from 'vue'

function useTodos(todoId: Ref<string>) {
  const queryKey = ['todos', todoId]
  return useQuery({
    queryKey,
    queryFn: () => fetchTodoById(todoId.value),
  })
}
```

[//]: # 'Example5'
