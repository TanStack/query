---
id: useQueries
title: useQueries
---

```ts
function useQueries<T, TCombinedResult>(__namedParameters, queryClient?): Readonly<Ref<TCombinedResult>>;
```

Defined in: [packages/vue-query/src/useQueries.ts:357](https://github.com/TanStack/query/blob/main/packages/vue-query/src/useQueries.ts#L357)

The `useQueries` composable can be used to fetch a variable number of queries.

The `queries` option accepts an array of query option objects mostly identical to `useQuery`'s. It may be a
plain array, a `ref`/reactive array (each entry tracked individually), or a getter function — pass a getter
if the array itself (its length, or which queries are in it) depends on other reactive state.

Having the same query key more than once in the array of query objects may cause some data to be shared
between queries. To avoid this, consider de-duplicating the queries and map the results back to the desired
structure.

The `combine` option can be used to combine the results of the queries into a single value. The result will
be structurally shared to be as referentially stable as possible.

`placeholderData` is supported here too, but unlike `useQuery`, it doesn't receive information from
previously rendered queries, because the number of queries can differ between renders.

## Type Parameters

### T

`T` *extends* `any`[]

### TCombinedResult

`TCombinedResult` = `T` *extends* \[\] ? \[\] : `T` *extends* \[`Head`\] ? \[`GetUseQueryResult`\<`Head`\>\] : `T` *extends* \[`Head`, `...Tails[]`\] ? \[`...Tails[]`\] *extends* \[\] ? \[\] : \[`...Tails[]`\] *extends* \[`Head`\] ? \[`GetUseQueryResult`\<`Head`\>, `GetUseQueryResult`\<`Head`\>\] : \[`...Tails[]`\] *extends* \[`Head`, `...Tails[]`\] ? \[`...Tails[]`\] *extends* \[\] ? \[\] : \[`...Tails[]`\] *extends* \[`Head`\] ? \[`GetUseQueryResult`\<`Head`\>, `GetUseQueryResult`\<`Head`\>, `GetUseQueryResult`\<`Head`\>\] : \[`...Tails[]`\] *extends* \[`Head`, `...Tails[]`\] ? \[`...(...)[]`\] *extends* \[\] ? \[\] : ... *extends* ... ? ... : ... : \[`...{ [K in (...)]: (...) }[]`\] : \[...\{ \[K in string \| number \| symbol\]: GetUseQueryResult\<Tails\[K\<(...)\>\]\> \}\[\]\] : \{ \[K in string \| number \| symbol\]: GetUseQueryResult\<T\[K\<K\>\]\> \}

## Parameters

### \_\_namedParameters

`ShallowOption` & `object`

### queryClient?

[`QueryClient`](../classes/QueryClient.md)

Use this to use a custom `QueryClient`. Otherwise, the one provided by `VueQueryPlugin`
will be used.

## Returns

`Readonly`\<`Ref`\<`TCombinedResult`\>\>

A `ref` to the combined result. Without `combine`, this is an array with all the query results, in
the same order as the input. When `combine` is provided, this is the value returned by `combine` instead.

## Examples

```vue
<script setup lang="ts">
import { useQueries } from '@tanstack/vue-query'

const props = defineProps<{ ids: Array<number> }>()

const postQueries = useQueries({
  queries: () =>
    props.ids.map((id) => ({
      queryKey: ['post', id],
      queryFn: () => fetchPost(id),
      staleTime: Infinity,
    })),
})
</script>

<template>
  <ul>
    <li v-for="(query, index) in postQueries" :key="props.ids[index]">
      <span v-if="query.isPending">Loading...</span>
      <span v-else-if="query.isError">Error: {{ query.error.message }}</span>
      <span v-else>{{ query.data.title }}</span>
    </li>
  </ul>
</template>
```

Combining results into a single value:
```vue
<script setup lang="ts">
import { useQueries } from '@tanstack/vue-query'

const props = defineProps<{ ids: Array<number> }>()

const combined = useQueries({
  queries: () =>
    props.ids.map((id) => ({
      queryKey: ['post', id],
      queryFn: () => fetchPost(id),
    })),
  combine: (postQueries) => ({
    data: postQueries.map((query) => query.data),
    isPending: postQueries.some((query) => query.isPending),
    isError: postQueries.some((query) => query.isError),
  }),
})
</script>

<template>
  <span v-if="combined.isPending">Loading...</span>
  <span v-else-if="combined.isError">Error!</span>
  <ul v-else>
    <li v-for="post in combined.data" :key="post.id">{{ post.title }}</li>
  </ul>
</template>
```

Typing `select` via [queryOptions](queryOptions.md). Note that spreading a `queryOptions` result and overriding
`select` inline still falls back to `unknown` — wrap the spread in `queryOptions` again so the override is
resolved before it reaches `useQueries`:
```vue
<script setup lang="ts">
import { queryOptions, useQueries } from '@tanstack/vue-query'

const props = defineProps<{ id: number }>()

const postOptions = (id: number) =>
  queryOptions({
    queryKey: ['post', id],
    queryFn: () => fetchPost(id),
  })

const [{ data: broken }] = useQueries({
  queries: () => [
    {
      ...postOptions(props.id),
      // ❌ `data` is `unknown` here
      select: (data) => data.title,
    },
  ],
})

const [{ data: fixed }] = useQueries({
  queries: () => [
    queryOptions({
      ...postOptions(props.id),
      // ✅ `data` is `Post`
      select: (data) => data.title,
    }),
  ],
})
</script>

<template>
  <h1>{{ fixed }}</h1>
</template>
```
