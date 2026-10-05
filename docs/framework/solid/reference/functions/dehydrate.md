---
id: dehydrate
title: dehydrate
---

```ts
function dehydrate(client: QueryClient, options?: DehydrateOptions): DehydratedState;
```

Defined in: [packages/query-core/src/hydration.ts:245](https://github.com/TanStack/query/blob/main/packages/query-core/src/hydration.ts#L245)

Dehydrates a `QueryClient`'s cache (queries and mutations) into a plain, serializable `DehydratedState`,
typically to embed in server-rendered markup and later restore into a client-side `QueryClient` via `hydrate`.
Which queries/mutations are included, and how their data/errors are transformed, is controlled by `options`,
falling back to the client's `dehydrate` default options, and finally to `defaultShouldDehydrateQuery` /
`defaultShouldDehydrateMutation`.

## Parameters

### client

`QueryClient`

The client whose cache is dehydrated.

### options?

[`DehydrateOptions`](../interfaces/DehydrateOptions.md) = `{}`

Controls which queries and mutations are included and how their data and errors
are transformed. Each option falls back to the client's `defaultOptions.dehydrate`.

## Returns

[`DehydratedState`](../interfaces/DehydratedState.md)

The dehydrated state, with the included `queries` and `mutations`.

## Example

```ts
const queryClient = new QueryClient()

await queryClient.prefetchQuery({
  queryKey: ['posts'],
  queryFn: getPosts,
})

const dehydratedState = dehydrate(queryClient)
```
