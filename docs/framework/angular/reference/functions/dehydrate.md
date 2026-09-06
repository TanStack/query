---
id: dehydrate
title: dehydrate
---

```ts
function dehydrate(client, options?): DehydratedState;
```

Defined in: packages/query-core/dist-ts/src/hydration.d.ts:101

Dehydrates a `QueryClient`'s cache (queries and mutations) into a plain, serializable `DehydratedState`,
typically to embed in server-rendered markup and later restore into a client-side `QueryClient` via `hydrate`.
Which queries/mutations are included, and how their data/errors are transformed, is controlled by `options`,
falling back to the client's `dehydrate` default options, and finally to `defaultShouldDehydrateQuery` /
`defaultShouldDehydrateMutation`.

## Parameters

### client

[`QueryClient`](../classes/QueryClient.md)

### options?

[`DehydrateOptions`](../interfaces/DehydrateOptions.md)

## Returns

[`DehydratedState`](../interfaces/DehydratedState.md)

## Example

```ts
const queryClient = new QueryClient()

await queryClient.prefetchQuery({
  queryKey: ['posts'],
  queryFn: getPosts,
})

const dehydratedState = dehydrate(queryClient)
```
