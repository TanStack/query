---
id: DehydrateOptions
title: DehydrateOptions
---

Defined in: packages/query-core/dist-ts/src/hydration.d.ts:10

Options for `dehydrate`, controlling which queries/mutations are included in the resulting `DehydratedState` and
how their data/errors are transformed before being serialized (e.g. for embedding in server-rendered markup).

## Properties

### serializeData?

```ts
optional serializeData: TransformerFn;
```

Defined in: packages/query-core/dist-ts/src/hydration.d.ts:12

Transforms a query's `data` before it is dehydrated. Useful for non-JSON-serializable data.

***

### shouldDehydrateMutation()?

```ts
optional shouldDehydrateMutation: (mutation) => boolean;
```

Defined in: packages/query-core/dist-ts/src/hydration.d.ts:14

Predicate to decide whether a given `Mutation` should be dehydrated. Defaults to `defaultShouldDehydrateMutation`.

#### Parameters

##### mutation

[`Mutation`](../classes/Mutation.md)

#### Returns

`boolean`

***

### shouldDehydrateQuery()?

```ts
optional shouldDehydrateQuery: (query) => boolean;
```

Defined in: packages/query-core/dist-ts/src/hydration.d.ts:16

Predicate to decide whether a given `Query` should be dehydrated. Defaults to `defaultShouldDehydrateQuery`.

#### Parameters

##### query

[`Query`](../classes/Query.md)

#### Returns

`boolean`

***

### shouldRedactErrors()?

```ts
optional shouldRedactErrors: (error) => boolean;
```

Defined in: packages/query-core/dist-ts/src/hydration.d.ts:22

Predicate to decide whether a query's error should be redacted before dehydration. Errors are redacted
(replaced with a generic `Error('redacted')`) unless this function is provided and returns `false` for the
given error, in which case the original error is kept.

#### Parameters

##### error

`unknown`

#### Returns

`boolean`
