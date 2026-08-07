---
name: core/implement-optimistic-updates-and-cache-writes
description: >
  Use this when implementing optimistic updates, onMutate rollback context,
  cancelQueries before writes, setQueryData, setQueriesData, immutable cache writes,
  mutation rollback, and offline-aware optimistic state.
type: core
library: TanStack Query
library_version: '5.101.0'
requires:
  - core/write-mutations-and-invalidate-related-queries
  - core/cancel-queries-and-consume-abort-signals
sources:
  - TanStack/query:docs/framework/react/guides/optimistic-updates.md
  - TanStack/query:docs/framework/react/guides/updates-from-mutation-responses.md
  - TanStack/query:docs/framework/react/guides/query-cancellation.md
  - TanStack/query:docs/framework/react/plugins/persistQueryClient.md
---

## Setup

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query'

type Todo = { id: number; title: string }

export function useOptimisticAddTodo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (title: string) => ({ id: Date.now(), title }),
    onMutate: async (title) => {
      await queryClient.cancelQueries({ queryKey: ['todos'] })
      const previous = queryClient.getQueryData<Array<Todo>>(['todos'])
      queryClient.setQueryData<Array<Todo>>(['todos'], (old = []) => [
        ...old,
        { id: -1, title },
      ])
      return { previous }
    },
    onError: (_error, _title, context) => {
      queryClient.setQueryData(['todos'], context?.previous)
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })
}
```

## Core Patterns

### Write mutation response into detail cache

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useUpdateTodo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (todo: { id: number; title: string }) => todo,
    onSuccess: (todo) => queryClient.setQueryData(['todo', todo.id], todo),
  })
}
```

### Update lists immutably

```ts
import { QueryClient } from '@tanstack/react-query'

const queryClient = new QueryClient()

queryClient.setQueryData<Array<{ id: number; title: string }>>(
  ['todos'],
  (old = []) =>
    old.map((todo) => (todo.id === 1 ? { ...todo, title: 'Done' } : todo)),
)
```

### Roll back with context

```ts
import { QueryClient } from '@tanstack/react-query'

const queryClient = new QueryClient()
const previous = queryClient.getQueryData(['todos'])
queryClient.setQueryData(['todos'], [{ id: 1, title: 'Optimistic' }])
queryClient.setQueryData(['todos'], previous)
```

## Common Mistakes

### CRITICAL Optimistic write without cancellation

Wrong:

```ts
import { QueryClient } from '@tanstack/react-query'

const queryClient = new QueryClient()
queryClient.setQueryData(['todos'], [{ id: 1, title: 'Optimistic' }])
```

Correct:

```ts
import { QueryClient } from '@tanstack/react-query'

const queryClient = new QueryClient()
await queryClient.cancelQueries({ queryKey: ['todos'] })
queryClient.setQueryData(['todos'], [{ id: 1, title: 'Optimistic' }])
```

An in-flight refetch can overwrite an optimistic write unless it is cancelled first.

Source: TanStack/query:docs/framework/react/guides/optimistic-updates.md

### CRITICAL In-place mutation

Wrong:

```ts
import { QueryClient } from '@tanstack/react-query'

const queryClient = new QueryClient()
queryClient.setQueryData<Array<{ id: number; done: boolean }>>(
  ['todos'],
  (old = []) => {
    old[0].done = true
    return old
  },
)
```

Correct:

```ts
import { QueryClient } from '@tanstack/react-query'

const queryClient = new QueryClient()
queryClient.setQueryData<Array<{ id: number; done: boolean }>>(
  ['todos'],
  (old = []) =>
    old.map((todo) => (todo.id === 1 ? { ...todo, done: true } : todo)),
)
```

Cache updates must be immutable so observers can detect and share changes correctly.

Source: TanStack/query:docs/framework/react/guides/updates-from-mutation-responses.md

### HIGH Persisted persister loses optimistic mutation

Wrong:

```ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient()
queryClient.setMutationDefaults(['updateTodo'], {})
```

Correct:

```ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient()
queryClient.setMutationDefaults(['updateTodo'], {
  mutationFn: async (todo: { id: number; title: string }) => todo,
})
```

Paused persisted mutations need a default mutationFn after hydration because functions cannot be serialized.

Source: TanStack/query:docs/framework/react/plugins/persistQueryClient.md

See also: `core/cancel-queries-and-consume-abort-signals` before optimistic writes.
