---
id: query-functions
title: Query Functions
ref: docs/framework/react/guides/query-functions.md
---

[//]: # 'Example'

```ts
injectQuery(() => ({ queryKey: ['todos'], queryFn: fetchAllTodos }))
injectQuery(() => ({
  queryKey: ['todos', todoId],
  queryFn: () => fetchTodoById(todoId),
}))
injectQuery(() => ({
  queryKey: ['todos', todoId],
  queryFn: async () => {
    const data = await fetchTodoById(todoId)
    return data
  },
}))
injectQuery(() => ({
  queryKey: ['todos', todoId],
  queryFn: ({ queryKey }) => fetchTodoById(queryKey[1]),
}))
```

[//]: # 'Example'
[//]: # 'Example2'

```ts
todoId = signal(1)

todos = injectQuery(() => ({
  queryKey: ['todos', this.todoId()],
  queryFn: async () => {
    if (somethingGoesWrong) {
      throw new Error('Oh no!')
    }
    if (somethingElseGoesWrong) {
      return Promise.reject(new Error('Oh no!'))
    }

    return data
  },
}))
```

[//]: # 'Example2'
[//]: # 'Example3'

```ts
todoId = signal(1)

todos = injectQuery(() => ({
  queryKey: ['todos', this.todoId()],
  queryFn: async () => {
    const response = await fetch('/todos/' + this.todoId())
    if (!response.ok) {
      throw new Error('Network response was not ok')
    }
    return response.json()
  },
}))
```

[//]: # 'Example3'
[//]: # 'Example4'

```ts
status = signal('active')
page = signal(1)

result = injectQuery(() => ({
  queryKey: ['todos', { status: this.status(), page: this.page() }],
  queryFn: fetchTodoList,
}))

// Access the key, status and page variables in your query function!
function fetchTodoList({ queryKey }) {
  const [_key, { status, page }] = queryKey
  return new Promise()
}
```

[//]: # 'Example4'
