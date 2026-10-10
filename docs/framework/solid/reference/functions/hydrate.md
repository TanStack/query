---
id: hydrate
title: hydrate
---

```ts
function hydrate(
   client: QueryClient, 
   dehydratedState: Partial<DehydratedState>, 
   options?: HydrateOptions): void;
```

Defined in: [packages/query-core/src/hydration.ts:306](https://github.com/TanStack/query/blob/main/packages/query-core/src/hydration.ts#L306)

Restores a `DehydratedState` (as produced by `dehydrate`) into a `QueryClient`'s cache, typically to seed the
client with data already fetched on the server. `mutations` and `queries` are each optional on `dehydratedState`.
Queries not yet in the cache are built from the dehydrated snapshot; queries that already exist are only updated
when the dehydrated data is newer than what's already cached. Newly built queries have their `fetchStatus` reset
to `'idle'` so they don't hydrate stuck in a fetching state. If a dehydrated query still had an in-flight
promise, it is resumed via `query.fetch()` (reusing that promise as `initialPromise`) rather than re-invoking
`queryFn`.

## Parameters

### client

`QueryClient`

The client whose cache is restored into.

### dehydratedState

`Partial`\<[`DehydratedState`](../interfaces/DehydratedState.md)\>

The dehydrated state, e.g. produced by `dehydrate` on the server.

<a id="dehydratedState-properties"></a>

#### `dehydratedState` properties

Built from [`DehydratedState`](../interfaces/DehydratedState.md#properties). See the type above for what it changes.

### options?

[`HydrateOptions`](../interfaces/HydrateOptions.md)

`defaultOptions` merged into every restored query and mutation (on top of the
client's `defaultOptions.hydrate`), and `deserializeData` to reverse `serializeData`.

<a id="options-properties"></a>

#### `options` properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="options-property-defaultoptions"></a> `defaultOptions?` | \{ `deserializeData?`: `TransformerFn`; `mutations?`: `MutationOptions`\<`unknown`, `Error`, `unknown`, `unknown`\>; `queries?`: `QueryOptions`\<`unknown`, `Error`, `unknown`, readonly `unknown`[], `never`\>; \} | Options applied to the queries and mutations restored from the dehydrated state. |
| `defaultOptions.deserializeData?` | `TransformerFn` | Transforms a query's `data` after it is read from the dehydrated state, reversing `serializeData`. |
| `defaultOptions.mutations?` | `MutationOptions`\<`unknown`, `Error`, `unknown`, `unknown`\> | Default options merged into every mutation restored from the dehydrated state. |
| `defaultOptions.queries?` | `QueryOptions`\<`unknown`, `Error`, `unknown`, readonly `unknown`[], `never`\> | Default options merged into every query restored from the dehydrated state. |

## Returns

`void`

## Example

```ts
// dehydratedState was produced by `dehydrate` on the server
// and sent to the client, e.g. embedded in server-rendered markup.
const queryClient = new QueryClient()

hydrate(queryClient, dehydratedState)
```
