---
id: lukemorales-query-key-factory
title: Query Key Factory
---

Typesafe query key management with auto-completion features. Focus on writing and invalidating queries without the hassle of remembering how you've set up a key for a specific query!


## Installation
You can install Query Key Factory via [NPM](https://www.npmjs.com/package/@lukemorales/query-key-factory).

```bash
$ npm i @lukemorales/query-key-factory
# or
$ pnpm add @lukemorales/query-key-factory
# or
$ yarn add @lukemorales/query-key-factory
```


## Quick start
Start by defining the query keys for your app:

### Declare everything in a single file
```tsx
import { createQueryKeyStore } from '@lukemorales/query-key-factory'

export const queryKeys = createQueryKeyStore({
  users: null,
  todos: {
    detail: (todoId: string) => [todoId],
    list: (filters: TodoFilters) => ({
      queryKey: [{ filters }],
      queryFn: (ctx) => api.getTodos({ filters, page: ctx.pageParam }),
    }),
  },
})
```

### Fine-grained declaration by features
```tsx
import { createQueryKeys, mergeQueryKeys } from '@lukemorales/query-key-factory'

// my-api/users.ts
export const usersKeys = createQueryKeys('users')

// my-api/todos.ts
export const todosKeys = createQueryKeys('todos', {
  detail: (todoId: string) => [todoId],
  list: (filters: TodoFilters) => ({
    queryKey: [{ filters }],
    queryFn: (ctx) => api.getTodos({ filters, page: ctx.pageParam }),
  }),
})

// my-api/index.ts
export const queryKeys = mergeQueryKeys(usersKeys, todosKeys)
```

Use throughout your codebase as the single source for writing the query keys for your cache management:
```tsx
import { queryKeys, completeTodo, fetchSingleTodo } from '../my-api'

export function Todo({ todoId }) {
  const queryClient = useQueryClient()

  const query = useQuery(queryKeys.todos.detail(todoId))

  const mutation = useMutation({
    mutationFn: completeTodo,
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.todos.list.queryKey })
    },
  })

  return (
    <div>
      <h1>
        {query.data?.title}
      </h1>

      <p>
        {query.data?.description}
      </p>

      <button
        onClick={() => {
          mutation.mutate({ todoId })
        }}
      >
        Complete Todo
      </button>
    </div>
  )
}
```

Check the complete documentation on [GitHub](https://github.com/lukemorales/query-key-factory).
