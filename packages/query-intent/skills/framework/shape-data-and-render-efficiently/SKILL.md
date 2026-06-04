---
name: framework/shape-data-and-render-efficiently
description: >
  Use this when optimizing TanStack Query rendering with structuralSharing,
  tracked properties, select, notifyOnChangeProps, stable hook deps, immutable
  data, Vue reactivity, and no-rest-destructuring or no-unstable-deps lint rules.
type: framework
library: TanStack Query
framework: cross-adapter
library_version: "5.101.0"
requires:
  - core/fetch-and-observe-queries
  - core/seed-placeholder-select-and-transform-data
sources:
  - TanStack/query:docs/framework/react/guides/render-optimizations.md
  - TanStack/query:docs/eslint/no-rest-destructuring.md
  - TanStack/query:docs/eslint/no-unstable-deps.md
  - TanStack/query:docs/framework/vue/reactivity.md
---

This skill builds on `core/fetch-and-observe-queries` and `core/seed-placeholder-select-and-transform-data`.

## Setup

```tsx
import { useQuery } from '@tanstack/react-query'

export function TodoCount() {
  const { data } = useQuery({
    queryKey: ['todos'],
    queryFn: async () => [{ id: 1 }, { id: 2 }],
    select: (todos) => todos.length,
  })
  return <p>{data ?? 0}</p>
}
```

## Hooks and Components

### Destructure only used result fields

```tsx
import { useQuery } from '@tanstack/react-query'

export function Todos() {
  const { data, isFetching } = useQuery({ queryKey: ['todos'], queryFn: async () => [{ id: 1 }] })
  return <pre>{isFetching ? 'Refreshing ' : ''}{JSON.stringify(data ?? [])}</pre>
}
```

### Keep Vue query data immutable

```ts
import { ref } from 'vue'

export function editableTodo(todo: { id: number; title: string }) {
  return ref({ ...todo })
}
```

### Use stable members in deps

```tsx
import * as React from 'react'
import { useQuery } from '@tanstack/react-query'

export function TodosEffect() {
  const { data } = useQuery({ queryKey: ['todos'], queryFn: async () => [{ id: 1 }] })
  React.useEffect(() => console.log(data?.length ?? 0), [data])
  return null
}
```

## Common Mistakes

### MEDIUM Rest destructuring

Wrong:

```ts
import { useQuery } from '@tanstack/react-query'

export function useTodos() {
  const { data, ...rest } = useQuery({ queryKey: ['todos'], queryFn: async () => [{ id: 1 }] })
  return { data, rest }
}
```

Correct:

```ts
import { useQuery } from '@tanstack/react-query'

export function useTodos() {
  const { data, isFetching, error } = useQuery({ queryKey: ['todos'], queryFn: async () => [{ id: 1 }] })
  return { data, isFetching, error }
}
```

Rest destructuring touches every tracked property and disables fine-grained render tracking.

Source: TanStack/query:docs/eslint/no-rest-destructuring.md

### HIGH Query result in hook deps

Wrong:

```tsx
import * as React from 'react'
import { useQuery } from '@tanstack/react-query'

export function Todos() {
  const query = useQuery({ queryKey: ['todos'], queryFn: async () => [{ id: 1 }] })
  React.useEffect(() => console.log(query.data), [query])
  return null
}
```

Correct:

```tsx
import * as React from 'react'
import { useQuery } from '@tanstack/react-query'

export function Todos() {
  const { data } = useQuery({ queryKey: ['todos'], queryFn: async () => [{ id: 1 }] })
  React.useEffect(() => console.log(data), [data])
  return null
}
```

The top-level query result object is not referentially stable; destructured members are tracked.

Source: TanStack/query:docs/eslint/no-unstable-deps.md

### HIGH Vue v-model mutates query result

Wrong:

```vue
<script setup lang="ts">
const todo = { id: 1, title: 'Ship' }
</script>
<template><input v-model="todo.title" /></template>
```

Correct:

```vue
<script setup lang="ts">
import { ref } from 'vue'
const editableTodo = ref({ id: 1, title: 'Ship' })
</script>
<template><input v-model="editableTodo.title" /></template>
```

Vue Query results are immutable; make a mutable copy for form state.

Source: TanStack/query:docs/framework/vue/reactivity.md

See also: `compositions/enforce-query-best-practices-with-eslint` for lint rules that protect render tracking.

