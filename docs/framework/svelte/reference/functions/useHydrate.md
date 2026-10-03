---
id: useHydrate
title: useHydrate
---

```ts
function useHydrate(
   state?: unknown, 
   options?: HydrateOptions, 
   queryClient?: QueryClient): void;
```

Defined in: [packages/svelte-query/src/useHydrate.ts:33](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/useHydrate.ts#L33)

Adds a previously dehydrated `state` into the `queryClient` (from the nearest context, or the one
passed explicitly). If the client already contains data, the new queries will be intelligently merged based
on update timestamp. `HydrationBoundary` wraps this — use it directly only if you need to hydrate from your
own component instead.

## Parameters

### state?

`unknown`

The dehydrated state to hydrate into the cache, as produced by `dehydrate`.

### options?

[`HydrateOptions`](../interfaces/HydrateOptions.md)

[HydrateOptions](../interfaces/HydrateOptions.md) to control the hydration.

<a id="options-properties"></a>

#### `options` properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="options-defaultoptions"></a> `defaultOptions?` | `object` | Options applied to the queries and mutations restored from the dehydrated state. |
| `defaultOptions.deserializeData?` | `TransformerFn` | Transforms a query's `data` after it is read from the dehydrated state, reversing `serializeData`. |
| `defaultOptions.mutations?` | [`MutationOptions`](../interfaces/MutationOptions.md)\<`unknown`, `Error`, `unknown`, `unknown`\> | Default options merged into every mutation restored from the dehydrated state. |
| `defaultOptions.queries?` | [`QueryOptions`](../interfaces/QueryOptions.md)\<`unknown`, `Error`, `unknown`, readonly `unknown`[], `never`\> | Default options merged into every query restored from the dehydrated state. |

### queryClient?

[`QueryClient`](../classes/QueryClient.md)

Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will
be used.

## Returns

`void`

## Example

Server-side prefetch handed off to the client via `dehydrate` — `dehydratedState` would typically come
from a server load function that prefetched with `queryClient.query` and called `dehydrate(queryClient)`:
```svelte
<script lang="ts">
  import { HydrationBoundary } from '@tanstack/svelte-query'
  import type { DehydratedState } from '@tanstack/svelte-query'
  import Posts from './Posts.svelte'

  let { dehydratedState }: { dehydratedState: DehydratedState } = $props()
</script>

<HydrationBoundary state={dehydratedState}>
  <Posts />
</HydrationBoundary>
```
