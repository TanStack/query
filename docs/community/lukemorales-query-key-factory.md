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
$ pnpm add @lukemorales/query-key-factory
# or
$ yarn add @lukemorales/query-key-factory
```


## Quick start
Start by defining the query keys for your app:

### Declare everything in a single file
```ts
import { createQueryKeyStore } from '@lukemorales/query-key-factory'

export const queryKeys = createQueryKeyStore({
  users: null,
  todos: {
    completed: null,
    search: (query: string, limit = 15) => [query, limit],
    byId: (todoId: string) => ({ todoId }),
  },
})
```

### Fine-grained declaration by features
```ts
import { createQueryKeys, mergeQueryKeys } from '@lukemorales/query-key-factory'

// my-api/users.ts
export const usersKeys = createQueryKeys('users')

// my-api/todos.ts
export const todosKeys = createQueryKeys('todos', {
  completed: null,
  search: (query: string, limit = 15) => [query, limit],
  byId: (todoId: string) => ({ todoId }),
})

// my-api/index.ts
export const queryKeys = mergeQueryKeys(usersKeys, todosKeys)
```

Use throughout your codebase as the single source for writing the query keys for your cache management:
```tsx
import { queryKeys, completeTodo, fetchSingleTodo } from '../my-api'

export function Todo({ todoId }) {
  const queryClient = useQueryClient()

  const query = useQuery({ queryKey: queryKeys.todos.byId(todoId), queryFn: fetchSingleTodo })

  const mutation = useMutation({
    mutationFn: () => completeTodo,
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.todos.completed })
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
