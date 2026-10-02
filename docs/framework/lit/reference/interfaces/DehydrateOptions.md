---
id: DehydrateOptions
title: DehydrateOptions
---

Defined in: [packages/query-core/src/hydration.ts:42](https://github.com/TanStack/query/blob/main/packages/query-core/src/hydration.ts#L42)

Options for `dehydrate`, controlling which queries/mutations are included in the resulting `DehydratedState` and
how their data/errors are transformed before being serialized (e.g. for embedding in server-rendered markup).

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="serializedata"></a> `serializeData?` | `TransformerFn` | Transforms a query's `data` before it is dehydrated. Useful for non-JSON-serializable data. |
| <a id="shoulddehydratemutation"></a> `shouldDehydrateMutation?` | (`mutation`: [`Mutation`](../classes/Mutation.md)) => `boolean` | Predicate to decide whether a given `Mutation` should be dehydrated. Defaults to `defaultShouldDehydrateMutation`. |
| <a id="shoulddehydratequery"></a> `shouldDehydrateQuery?` | (`query`: [`Query`](../classes/Query.md)) => `boolean` | Predicate to decide whether a given `Query` should be dehydrated. Defaults to `defaultShouldDehydrateQuery`. |
| <a id="shouldredacterrors"></a> `shouldRedactErrors?` | (`error`: `unknown`) => `boolean` | Predicate to decide whether a query's error should be redacted before dehydration. Errors are redacted (replaced with a generic `Error('redacted')`) unless this function is provided and returns `false` for the given error, in which case the original error is kept. |
