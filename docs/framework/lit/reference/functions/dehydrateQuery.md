---
id: dehydrateQuery
title: dehydrateQuery
---

```ts
function dehydrateQuery(
   query,
   serializeData?,
   shouldRedactErrors?): DehydratedQuery;
```

Defined in: [packages/query-core/src/hydration.ts:148](https://github.com/TanStack/query/blob/main/packages/query-core/src/hydration.ts#L148)

Dehydrates a single `Query` into a serializable `DehydratedQuery` snapshot. Note that most query config (e.g.
`queryFn`, `staleTime`) is not dehydrated but instead meant to be configured again when consuming the
de/rehydrated data, typically with `useQuery` on the client. If the query is still `pending`, its in-flight
promise is dehydrated too so it can be resumed on the other side instead of re-fetched.

## Parameters

### query

[`Query`](../classes/Query.md)

The query to dehydrate.

### serializeData?

`TransformerFn`

Optional transform applied to `query.state.data` before it is included in the snapshot.

### shouldRedactErrors?

(`error`) => `boolean`

Optional predicate; if it returns `false` for the promise's rejection error, that
error is kept as-is instead of being redacted.

## Returns

`DehydratedQuery`
