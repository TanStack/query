---
id: query-keys
title: Query Keys
ref: docs/framework/react/guides/query-keys.md
replace:
  {
    '@tanstack/react-query': '@tanstack/svelte-query',
    'useQuery[(]': 'createQuery(() => ',
    'React Query Keys': 'TanStack Query Keys',
  }
---

[//]: # 'Example'

```svelte
<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'

  // A list of todos
  createQuery(() => ({ queryKey: ['todos'], queryFn: fetchTodos }))

  // Something else, whatever!
  createQuery(() => ({
    queryKey: ['something', 'special'],
    queryFn: fetchSomethingSpecial,
  }))
</script>
```

[//]: # 'Example'
[//]: # 'Example2'

```svelte
<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'

  // An individual todo
  createQuery(() => ({
    queryKey: ['todo', 5],
    queryFn: async () => fetchTodos(5),
  }))

  // An individual todo in a "preview" format
  createQuery(() => ({
    queryKey: ['todo', 5, { preview: true }],
    queryFn: async () => fetchTodos(5, { preview: true }),
  }))

  // A list of todos that are "done"
  createQuery(() => ({
    queryKey: ['todos', { type: 'done' }],
    queryFn: async () => fetchTodos(5, { type: 'done' }),
  }))
</script>
```

[//]: # 'Example2'
[//]: # 'Example3'

```svelte
<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'

  createQuery(() => ({
    queryKey: ['todos', { status, page }],
    queryFn: async () => fetchTodos(5, { status, page }),
  }))
  createQuery(() => ({
    queryKey: ['todos', { page, status }],
    queryFn: async () => fetchTodos(5, { page, status }),
  }))
  createQuery(() => ({
    queryKey: ['todos', { page, status, other: undefined }],
    queryFn: async () => fetchTodos(5, { page, status, other: undefined }),
  }))
</script>
```

[//]: # 'Example3'
[//]: # 'Example4'

```svelte
<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'

  createQuery(() => ({
    queryKey: ['todos', status, page],
    queryFn: async () => fetchTodos(5, { status, page }),
  }))
  createQuery(() => ({
    queryKey: ['todos', page, status],
    queryFn: async () => fetchTodos(5, { page, status }),
  }))
  createQuery(() => ({
    queryKey: ['todos', undefined, page, status],
    queryFn: async () => fetchTodos(5, { other: undefined, page, status }),
  }))
</script>
```

[//]: # 'Example4'
[//]: # 'Example5'

```svelte
<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'

  const { todoId }: { todoId: string } = $props()

  const todosQuery = createQuery(() => ({
    queryKey: ['todos', todoId],
    queryFn: () => fetchTodoById(todoId),
  }))
</script>
```

[//]: # 'Example5'
