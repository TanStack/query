---
id: dehydrate
title: dehydrate
---

```ts
function dehydrate(client: QueryClient, options: DehydrateOptions): DehydratedState;
```

Defined in: [packages/query-core/src/hydration.ts:208](https://github.com/TanStack/query/blob/main/packages/query-core/src/hydration.ts#L208)

Dehydrates a `QueryClient`'s cache (queries and mutations) into a plain, serializable `DehydratedState`,
typically to embed in server-rendered markup and later restore into a client-side `QueryClient` via `hydrate`.
Which queries/mutations are included, and how their data/errors are transformed, is controlled by `options`,
falling back to the client's `dehydrate` default options, and finally to `defaultShouldDehydrateQuery` /
`defaultShouldDehydrateMutation`.

## Parameters

### client

`QueryClient`

### options

[`DehydrateOptions`](../interfaces/DehydrateOptions.md) = `{}`

<a id="options-properties"></a>

#### `options` properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="options-serializedata"></a> `serializeData?` | `TransformerFn` | Transforms a query's `data` before it is dehydrated. Useful for non-JSON-serializable data. |
| <a id="options-shoulddehydratemutation"></a> `shouldDehydrateMutation?` | (`mutation`: [`Mutation`](../classes/Mutation.md)) => `boolean` | Predicate to decide whether a given `Mutation` should be dehydrated. Defaults to `defaultShouldDehydrateMutation`. |
| <a id="options-shoulddehydratequery"></a> `shouldDehydrateQuery?` | (`query`: [`Query`](../classes/Query.md)) => `boolean` | Predicate to decide whether a given `Query` should be dehydrated. Defaults to `defaultShouldDehydrateQuery`. |
| <a id="options-shouldredacterrors"></a> `shouldRedactErrors?` | (`error`: `unknown`) => `boolean` | Predicate to decide whether a query's error should be redacted before dehydration. Errors are redacted (replaced with a generic `Error('redacted')`) unless this function is provided and returns `false` for the given error, in which case the original error is kept. |

## Returns

[`DehydratedState`](../interfaces/DehydratedState.md)

<a id="result-properties"></a>

### Result properties

| Property | Type |
| ------ | ------ |
| <a id="result-mutations"></a> `mutations` | `DehydratedMutation`[] |
| <a id="result-queries"></a> `queries` | `DehydratedQuery`[] |

## Example

```ts
const queryClient = new QueryClient()

await queryClient.prefetchQuery({
  queryKey: ['posts'],
  queryFn: getPosts,
})

const dehydratedState = dehydrate(queryClient)
```
