---
name: compositions/enforce-query-best-practices-with-eslint
description: >
  Use this when configuring @tanstack/eslint-plugin-query, flat/recommended,
  flat/recommended-strict, exhaustive-deps, no-rest-destructuring,
  no-unstable-deps, no-void-query-fn, stable-query-client, prefer-query-options,
  infinite-query-property-order, and mutation-property-order.
type: composition
library: TanStack Query
library_version: '5.101.0'
requires:
  - core/design-query-keys-and-options
  - core/fetch-and-observe-queries
  - framework/shape-data-and-render-efficiently
sources:
  - TanStack/query:docs/eslint/eslint-plugin-query.md
  - TanStack/query:docs/eslint/exhaustive-deps.md
  - TanStack/query:docs/eslint/no-rest-destructuring.md
  - TanStack/query:docs/eslint/no-unstable-deps.md
  - TanStack/query:docs/eslint/no-void-query-fn.md
  - TanStack/query:docs/eslint/prefer-query-options.md
  - TanStack/query:docs/eslint/stable-query-client.md
  - TanStack/query:docs/eslint/infinite-query-property-order.md
  - TanStack/query:docs/eslint/mutation-property-order.md
---

## Setup

```js
import pluginQuery from '@tanstack/eslint-plugin-query'

export default [...pluginQuery.configs['flat/recommended']]
```

## Core Integration Patterns

### Use strict when generating Query-heavy code

```js
import pluginQuery from '@tanstack/eslint-plugin-query'

export default [...pluginQuery.configs['flat/recommended-strict']]
```

### Prefer option factories

```ts
import { queryOptions, useQuery } from '@tanstack/react-query'

const todosOptions = queryOptions({
  queryKey: ['todos'],
  queryFn: async () => [{ id: 1 }],
})

export function useTodos() {
  return useQuery(todosOptions)
}
```

### Keep inference-sensitive property order

```ts
import { useInfiniteQuery } from '@tanstack/react-query'

export function useFeed() {
  return useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: async ({ pageParam }) => ({ nextCursor: pageParam + 1 }),
    initialPageParam: 0,
    getNextPageParam: (page) => page.nextCursor,
  })
}
```

## Common Mistakes

### MEDIUM Strict rule not enabled

Wrong:

```js
import pluginQuery from '@tanstack/eslint-plugin-query'

export default [...pluginQuery.configs['flat/recommended']]
```

Correct:

```js
import pluginQuery from '@tanstack/eslint-plugin-query'

export default [...pluginQuery.configs['flat/recommended-strict']]
```

Strict mode catches option-factory and inference patterns that agents commonly miss.

Source: TanStack/query:docs/eslint/eslint-plugin-query.md

### MEDIUM Infinite option property order

Wrong:

```ts
import { useInfiniteQuery } from '@tanstack/react-query'

export function useFeed() {
  return useInfiniteQuery({
    queryFn: async () => ({ nextCursor: 1 }),
    queryKey: ['feed'],
    getNextPageParam: (page) => page.nextCursor,
    initialPageParam: 0,
  })
}
```

Correct:

```ts
import { useInfiniteQuery } from '@tanstack/react-query'

export function useFeed() {
  return useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: async ({ pageParam }) => ({ nextCursor: pageParam + 1 }),
    initialPageParam: 0,
    getNextPageParam: (page) => page.nextCursor,
  })
}
```

Some infinite-query inference depends on stable option ordering.

Source: TanStack/query:docs/eslint/infinite-query-property-order.md

### MEDIUM Mutation option property order

Wrong:

```ts
import { useMutation } from '@tanstack/react-query'

export function useSave() {
  return useMutation({
    onSuccess: () => console.log('saved'),
    mutationFn: async (title: string) => title,
  })
}
```

Correct:

```ts
import { useMutation } from '@tanstack/react-query'

export function useSave() {
  return useMutation({
    mutationFn: async (title: string) => title,
    onSuccess: () => console.log('saved'),
  })
}
```

The mutation property order rule preserves inference for mutation options.

Source: TanStack/query:docs/eslint/mutation-property-order.md

See also: `core/design-query-keys-and-options` for the patterns these rules protect.
