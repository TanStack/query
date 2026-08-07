---
name: framework/use-framework-adapter-reactivity
description: >
  Use this when translating Query patterns across React, Preact, Vue, Solid,
  Svelte, Angular, and Lit adapters: Vue refs/getters, Solid signals, Svelte
  stores/runes, Angular signals and HttpClient promises, Lit QueryController,
  adapter option helpers, and provider APIs.
type: framework
library: TanStack Query
framework: cross-adapter
library_version: '5.101.0'
requires:
  - lifecycle/setup-query-client-and-providers
  - core/design-query-keys-and-options
sources:
  - TanStack/query:docs/framework/vue/reactivity.md
  - TanStack/query:docs/framework/vue/guides/query-options.md
  - TanStack/query:docs/framework/solid/guides/query-options.md
  - TanStack/query:docs/framework/svelte/overview.md
  - TanStack/query:docs/framework/svelte/migrate-from-v5-to-v6.md
  - TanStack/query:docs/framework/angular/overview.md
  - TanStack/query:docs/framework/angular/zoneless.md
  - TanStack/query:docs/framework/lit/guides/reactive-controllers-vs-hooks.md
---

This skill builds on `lifecycle/setup-query-client-and-providers` and `core/design-query-keys-and-options`.

## Setup

```ts
import { queryOptions } from '@tanstack/react-query'

export function todoOptions(id: string) {
  return queryOptions({
    queryKey: ['todo', id],
    queryFn: async () => ({ id }),
  })
}
```

## Hooks and Components

### Keep Vue refs in the key

```ts
import { computed, toRef } from 'vue'
import { useQuery } from '@tanstack/vue-query'

export function useTodo(props: { id: string }) {
  const id = toRef(props, 'id')
  return useQuery(
    computed(() => ({
      queryKey: ['todo', id.value],
      queryFn: async () => ({ id: id.value }),
    })),
  )
}
```

### Use Solid option functions

```ts
import { createQuery } from '@tanstack/solid-query'

export function useTodo(id: () => string) {
  return createQuery(() => ({
    queryKey: ['todo', id()],
    queryFn: async () => ({ id: id() }),
  }))
}
```

### Convert Angular Observable clients to promises

```ts
import { injectQuery } from '@tanstack/angular-query-experimental'
import { firstValueFrom, of } from 'rxjs'

export class TodosQuery {
  todos = injectQuery(() => ({
    queryKey: ['todos'],
    queryFn: () => firstValueFrom(of([{ id: 1 }])),
  }))
}
```

## Common Mistakes

### HIGH Vue ref unwrapped

Wrong:

```ts
import { useQuery } from '@tanstack/vue-query'

export function useTodo(id: { value: string }) {
  return useQuery({
    queryKey: ['todo', id.value],
    queryFn: async () => ({ id: id.value }),
  })
}
```

Correct:

```ts
import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'

export function useTodo(id: { value: string }) {
  return useQuery(
    computed(() => ({
      queryKey: ['todo', id.value],
      queryFn: async () => ({ id: id.value }),
    })),
  )
}
```

Vue reactive inputs need to stay reactive through the options object or query key.

Source: TanStack/query:docs/framework/vue/reactivity.md

### HIGH Svelte store syntax in v6

Wrong:

```svelte
<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'
  const query = createQuery({ queryKey: ['todos'], queryFn: async () => [] })
</script>
```

Correct:

```svelte
<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'
  const query = createQuery(() => ({
    queryKey: ['todos'],
    queryFn: async () => [],
  }))
</script>
```

Svelte Query v6 uses rune-compatible option functions rather than the older store shape.

Source: TanStack/query:docs/framework/svelte/migrate-from-v5-to-v6.md

### HIGH Angular Observable returned directly

Wrong:

```ts
import { injectQuery } from '@tanstack/angular-query-experimental'
import { of } from 'rxjs'

export class TodosQuery {
  todos = injectQuery(() => ({
    queryKey: ['todos'],
    queryFn: () => of([{ id: 1 }]),
  }))
}
```

Correct:

```ts
import { injectQuery } from '@tanstack/angular-query-experimental'
import { firstValueFrom, of } from 'rxjs'

export class TodosQuery {
  todos = injectQuery(() => ({
    queryKey: ['todos'],
    queryFn: () => firstValueFrom(of([{ id: 1 }])),
  }))
}
```

Query functions must resolve data; Angular HttpClient Observables need conversion to promises.

Source: TanStack/query:docs/framework/angular/angular-httpclient-and-other-data-fetching-clients.md

See also: `core/design-query-keys-and-options` for key identity across adapters.
