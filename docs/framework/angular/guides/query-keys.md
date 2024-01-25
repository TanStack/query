---
id: query-keys
title: Query Keys
ref: docs/react/guides/query-keys.md
#todo: exhaustive-deps is at least for now React-only
---

[//]: # 'Example'

```ts
// A list of todos
injectQuery(() => ({ queryKey: ['todos'], ... }))

// Something else, whatever!
injectQuery(() => ({ queryKey: ['something', 'special'], ... }))
```

[//]: # 'Example'
[//]: # 'Example2'

```ts
// An individual todo
injectQuery(() => ({queryKey: ['todo', 5], ...}))

// An individual todo in a "preview" format
injectQuery(() => ({queryKey: ['todo', 5, {preview: true}], ...}))

// A list of todos that are "done"
injectQuery(() => ({queryKey: ['todos', {type: 'done'}], ...}))
```

[//]: # 'Example2'
[//]: # 'Example3'

```ts
injectQuery(() => ({ queryKey: ['todos', { status, page }], ... }))
injectQuery(() => ({ queryKey: ['todos', { page, status }], ...}))
injectQuery(() => ({ queryKey: ['todos', { page, status, other: undefined }], ... }))
```

[//]: # 'Example3'
[//]: # 'Example4'

```ts
injectQuery(() => ({ queryKey: ['todos', status, page], ... }))
injectQuery(() => ({ queryKey: ['todos', page, status], ...}))
injectQuery(() => ({ queryKey: ['todos', undefined, page, status], ...}))
```

[//]: # 'Example4'
[//]: # 'Example5'

```ts
todoId = signal(-1)

injectQuery(() => ({
  enabled: todoId() > 0,
  queryKey: ['todos', todoId()],
  queryFn: () => fetchTodoById(todoId()),
}))
```

[//]: # 'Example5'
[//]: # 'Materials'
[//]: # 'Materials'
