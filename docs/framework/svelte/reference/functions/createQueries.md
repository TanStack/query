---
id: createQueries
title: createQueries
---

```ts
function createQueries<T, TCombinedResult>(createQueriesOptions, queryClient?): TCombinedResult;
```

Defined in: [packages/svelte-query/src/createQueries.svelte.ts:260](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/createQueries.svelte.ts#L260)

## Type Parameters

### T

`T` *extends* `any`[]

### TCombinedResult

`TCombinedResult` = `T` *extends* \[\] ? \[\] : `T` *extends* \[`Head`\] ? \[`GetCreateQueryResult`\<`Head`\>\] : `T` *extends* \[`Head`, `...Tails[]`\] ? \[`...Tails[]`\] *extends* \[\] ? \[\] : \[`...Tails[]`\] *extends* \[`Head`\] ? \[`GetCreateQueryResult`\<`Head`\>, `GetCreateQueryResult`\<`Head`\>\] : \[`...Tails[]`\] *extends* \[`Head`, `...Tails[]`\] ? \[`...Tails[]`\] *extends* \[\] ? \[\] : \[`...Tails[]`\] *extends* \[`Head`\] ? \[`GetCreateQueryResult`\<`Head`\>, `GetCreateQueryResult`\<`Head`\>, `GetCreateQueryResult`\<`Head`\>\] : \[`...Tails[]`\] *extends* \[`Head`, `...Tails[]`\] ? \[`...(...)[]`\] *extends* \[\] ? \[\] : ... *extends* ... ? ... : ... : \[`...{ [K in (...)]: (...) }[]`\] : \[...\{ \[K in string \| number \| symbol\]: GetCreateQueryResult\<Tails\[K\<(...)\>\]\> \}\[\]\] : \{ \[K in string \| number \| symbol\]: GetCreateQueryResult\<T\[K\<K\>\]\> \}

## Parameters

### createQueriesOptions

[`Accessor`](../type-aliases/Accessor.md)\<\{
  `combine?`: (`result`) => `TCombinedResult`;
  `queries`:   \| readonly \[`T` *extends* \[\] ? \[\] : `T` *extends* \[`Head`\] ? \[`GetCreateQueryOptionsForCreateQueries`\<`Head`\>\] : `T` *extends* \[`Head`, `...Tails[]`\] ? \[`...Tails[]`\] *extends* \[\] ? \[\] : \[`...Tails[]`\] *extends* \[`Head`\] ? \[`GetCreateQueryOptionsForCreateQueries`\<...\>, `GetCreateQueryOptionsForCreateQueries`\<...\>\] : \[`...(...)[]`\] *extends* \[..., `...(...)[]`\] ? ... *extends* ... ? ... : ... : ... *extends* ... ? ... : ... : readonly `unknown`[] *extends* `T` ? `T` : `T` *extends* `CreateQueryOptionsForCreateQueries`\<..., ..., ..., ...\>[] ? `CreateQueryOptionsForCreateQueries`\<..., ..., ..., ...\>[] : `CreateQueryOptionsForCreateQueries`\<..., ..., ..., ...\>[]\]
     \| readonly \[\{ \[K in string \| number \| symbol\]: GetCreateQueryOptionsForCreateQueries\<T\[K\<K\>\]\> \}\];
\}\>

The `queries` array to run, and an optional `combine` function, wrapped in an
[Accessor](../type-aliases/Accessor.md) so options can be reactive.

### queryClient?

[`Accessor`](../type-aliases/Accessor.md)\<[`QueryClient`](../classes/QueryClient.md)\>

Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context
will be used.

## Returns

`TCombinedResult`

An array with one result per query, in the same order as `queries` — or, if `combine` is provided,
whatever `combine` returns.

## Examples

```svelte
<script lang="ts">
  import { createQueries } from '@tanstack/svelte-query'

  let { ids }: { ids: Array<number> } = $props()

  const postQueries = createQueries(() => ({
    queries: ids.map((id) => ({
      queryKey: ['post', id],
      queryFn: () => fetchPost(id),
      staleTime: Infinity,
    })),
  }))
</script>

<ul>
  {#each postQueries as query, index (ids[index])}
    {#if query.isPending}
      <li>Loading...</li>
    {:else if query.isError}
      <li>Error: {query.error.message}</li>
    {:else}
      <li>{query.data.title}</li>
    {/if}
  {/each}
</ul>
```

Combining results into a single value:
```svelte
<script lang="ts">
  import { createQueries } from '@tanstack/svelte-query'

  let { ids }: { ids: Array<number> } = $props()

  const combined = createQueries(() => ({
    queries: ids.map((id) => ({
      queryKey: ['post', id],
      queryFn: () => fetchPost(id),
    })),
    combine: (postQueries) => ({
      data: postQueries.map((query) => query.data),
      isPending: postQueries.some((query) => query.isPending),
      isError: postQueries.some((query) => query.isError),
    }),
  }))
</script>

{#if combined.isPending}
  Loading...
{:else if combined.isError}
  Error loading posts
{:else}
  <ul>
    {#each combined.data as post}
      <li>{post?.title}</li>
    {/each}
  </ul>
{/if}
```
