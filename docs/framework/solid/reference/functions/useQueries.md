---
id: useQueries
title: useQueries
redirect_from:
  - framework/solid/reference/useQueries
---

```ts
function useQueries<T, TCombinedResult>(queriesOptions, queryClient?): TCombinedResult;
```

Defined in: [packages/solid-query/src/useQueries.ts:274](https://github.com/TanStack/query/blob/main/packages/solid-query/src/useQueries.ts#L274)

The `useQueries` hook can be used to fetch a variable number of queries.

The `queries` key accepts an array with query option objects mostly identical to `useQuery` — see
`placeholderData` below for the one difference. A custom `QueryClient` is supplied once, as `useQueries`'
own top-level second argument, rather than per query.

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

`TCombinedResult` *extends* 
  \| \[\]
  \| \[
  \| [`QueryObserverRefetchErrorResult`](../interfaces/QueryObserverRefetchErrorResult.md)\<`unknown`, `Error`\>
  \| [`QueryObserverSuccessResult`](../interfaces/QueryObserverSuccessResult.md)\<`unknown`, `Error`\>
  \| [`QueryObserverLoadingErrorResult`](../interfaces/QueryObserverLoadingErrorResult.md)\<`unknown`, `Error`\>
  \| [`QueryObserverLoadingResult`](../interfaces/QueryObserverLoadingResult.md)\<`unknown`, `Error`\>
  \| [`QueryObserverPendingResult`](../interfaces/QueryObserverPendingResult.md)\<`unknown`, `Error`\>
  \| [`QueryObserverPlaceholderResult`](../interfaces/QueryObserverPlaceholderResult.md)\<`unknown`, `Error`\>
  \| [`QueryObserverRefetchErrorResult`](../interfaces/QueryObserverRefetchErrorResult.md)\<`unknown`, `unknown`\>
  \| [`QueryObserverSuccessResult`](../interfaces/QueryObserverSuccessResult.md)\<`unknown`, `unknown`\>
  \| [`QueryObserverLoadingErrorResult`](../interfaces/QueryObserverLoadingErrorResult.md)\<`unknown`, `unknown`\>
  \| [`QueryObserverLoadingResult`](../interfaces/QueryObserverLoadingResult.md)\<`unknown`, `unknown`\>
  \| [`QueryObserverPendingResult`](../interfaces/QueryObserverPendingResult.md)\<`unknown`, `unknown`\>
  \| [`QueryObserverPlaceholderResult`](../interfaces/QueryObserverPlaceholderResult.md)\<`unknown`, `unknown`\>\]
  \| (
  \| [`QueryObserverRefetchErrorResult`](../interfaces/QueryObserverRefetchErrorResult.md)\<`unknown`, `Error`\>
  \| [`QueryObserverSuccessResult`](../interfaces/QueryObserverSuccessResult.md)\<`unknown`, `Error`\>
  \| [`QueryObserverLoadingErrorResult`](../interfaces/QueryObserverLoadingErrorResult.md)\<`unknown`, `Error`\>
  \| [`QueryObserverLoadingResult`](../interfaces/QueryObserverLoadingResult.md)\<`unknown`, `Error`\>
  \| [`QueryObserverPendingResult`](../interfaces/QueryObserverPendingResult.md)\<`unknown`, `Error`\>
  \| [`QueryObserverPlaceholderResult`](../interfaces/QueryObserverPlaceholderResult.md)\<`unknown`, `Error`\>
  \| [`QueryObserverRefetchErrorResult`](../interfaces/QueryObserverRefetchErrorResult.md)\<`unknown`, `unknown`\>
  \| [`QueryObserverSuccessResult`](../interfaces/QueryObserverSuccessResult.md)\<`unknown`, `unknown`\>
  \| [`QueryObserverLoadingErrorResult`](../interfaces/QueryObserverLoadingErrorResult.md)\<`unknown`, `unknown`\>
  \| [`QueryObserverLoadingResult`](../interfaces/QueryObserverLoadingResult.md)\<`unknown`, `unknown`\>
  \| [`QueryObserverPendingResult`](../interfaces/QueryObserverPendingResult.md)\<`unknown`, `unknown`\>
  \| [`QueryObserverPlaceholderResult`](../interfaces/QueryObserverPlaceholderResult.md)\<`unknown`, `unknown`\>)[] = `T` *extends* \[\] ? \[\] : `T` *extends* \[`Head`\] ? \[`GetResults`\<`Head`\>\] : `T` *extends* \[`Head`, `...Tail[]`\] ? \[`...Tail[]`\] *extends* \[\] ? \[\] : \[`...Tail[]`\] *extends* \[`Head`\] ? \[`GetResults`\<`Head`\>, `GetResults`\<`Head`\>\] : \[`...Tail[]`\] *extends* \[`Head`, `...Tail[]`\] ? \[`...Tail[]`\] *extends* \[\] ? \[\] : \[`...Tail[]`\] *extends* \[`Head`\] ? \[`GetResults`\<`Head`\>, `GetResults`\<`Head`\>, `GetResults`\<`Head`\>\] : \[`...Tail[]`\] *extends* \[`Head`, `...Tail[]`\] ? \[`...(...)[]`\] *extends* \[\] ? \[\] : ... *extends* ... ? ... : ... : \[`...{ [K in (...)]: (...) }[]`\] : \[...\{ \[K in string \| number \| symbol\]: GetResults\<Tail\[K\<(...)\>\]\> \}\[\]\] : \{ \[K in string \| number \| symbol\]: GetResults\<T\[K\<K\>\]\> \}

## Parameters

### queriesOptions

`Accessor`\<\{
  `combine?`: (`result`) => `TCombinedResult`;
  `queries`:   \| readonly \[`T` *extends* \[\] ? \[\] : `T` *extends* \[`Head`\] ? \[`GetOptions`\<`Head`\>\] : `T` *extends* \[`Head`, `...Tail[]`\] ? \[`...Tail[]`\] *extends* \[\] ? \[\] : \[`...Tail[]`\] *extends* \[`Head`\] ? \[`GetOptions`\<...\>, `GetOptions`\<...\>\] : \[`...(...)[]`\] *extends* \[..., `...(...)[]`\] ? ... *extends* ... ? ... : ... : ... *extends* ... ? ... : ... : readonly `unknown`[] *extends* `T` ? `T` : `T` *extends* `UseQueryOptionsForUseQueries`\<..., ..., ..., ...\>[] ? `UseQueryOptionsForUseQueries`\<..., ..., ..., ...\>[] : `UseQueryOptionsForUseQueries`\<..., ..., ..., ...\>[]\]
     \| readonly \[\{ \[K in string \| number \| symbol\]: GetOptions\<T\[K\<K\>\]\> \}\];
\}\>

An accessor returning the `queries` array to run, and an optional `combine`
function.

### queryClient?

`Accessor`\<[`QueryClient`](../classes/QueryClient.md)\>

An accessor for a custom `QueryClient`. Otherwise, the one from the nearest context
will be used.

## Returns

`TCombinedResult`

The combined result. Without `combine`, this is an array with all the query results, in the same
order as the input. When `combine` is provided, this is the value returned by `combine` instead.

## Examples

```tsx
import { For } from 'solid-js'
import { useQueries } from '@tanstack/solid-query'

function Posts(props: { ids: Array<number> }) {
  const postQueries = useQueries(() => ({
    queries: props.ids.map((id) => ({
      queryKey: ['post', id],
      queryFn: () => fetchPost(id),
      staleTime: Infinity,
    })),
  }))

  return (
    <ul>
      <For each={postQueries}>
        {(postQuery) => {
          if (postQuery.isPending) return <li>Loading...</li>
          if (postQuery.isError) return <li>Error: {postQuery.error.message}</li>
          return <li>{postQuery.data.title}</li>
        }}
      </For>
    </ul>
  )
}
```

Combining results into a single value:
```tsx
import { For, Match, Switch } from 'solid-js'
import { useQueries } from '@tanstack/solid-query'

function Posts(props: { ids: Array<number> }) {
  const combinedPostsQuery = useQueries(() => ({
    queries: props.ids.map((id) => ({
      queryKey: ['post', id],
      queryFn: () => fetchPost(id),
    })),
    combine: (postQueries) => {
      return {
        data: postQueries.map((postQuery) => postQuery.data),
        isPending: postQueries.some((postQuery) => postQuery.isPending),
        isError: postQueries.some((postQuery) => postQuery.isError),
      }
    },
  }))

  return (
    <Switch
      fallback={
        <ul>
          <For each={combinedPostsQuery.data}>{(post) => <li>{post?.title}</li>}</For>
        </ul>
      }
    >
      <Match when={combinedPostsQuery.isPending}>Loading...</Match>
      <Match when={combinedPostsQuery.isError}>Error loading posts</Match>
    </Switch>
  )
}
```
