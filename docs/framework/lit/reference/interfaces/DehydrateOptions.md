---
id: DehydrateOptions
title: DehydrateOptions
---

Defined in: [packages/query-core/src/hydration.ts:42](https://github.com/TanStack/query/blob/main/packages/query-core/src/hydration.ts#L42)

Options for `dehydrate`, controlling which queries/mutations are included in the resulting `DehydratedState` and
how their data/errors are transformed before being serialized (e.g. for embedding in server-rendered markup).

## Properties

### serializeData?

```ts
optional serializeData: TransformerFn;
```

Defined in: [packages/query-core/src/hydration.ts:44](https://github.com/TanStack/query/blob/main/packages/query-core/src/hydration.ts#L44)

Transforms a query's `data` before it is dehydrated. Useful for non-JSON-serializable data.

***

### shouldDehydrateMutation()?

```ts
optional shouldDehydrateMutation: (mutation) => boolean;
```

Defined in: [packages/query-core/src/hydration.ts:46](https://github.com/TanStack/query/blob/main/packages/query-core/src/hydration.ts#L46)

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

Defined in: [packages/query-core/src/hydration.ts:48](https://github.com/TanStack/query/blob/main/packages/query-core/src/hydration.ts#L48)

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

Defined in: [packages/query-core/src/hydration.ts:54](https://github.com/TanStack/query/blob/main/packages/query-core/src/hydration.ts#L54)

Predicate to decide whether a query's error should be redacted before dehydration. Errors are redacted
(replaced with a generic `Error('redacted')`) unless this function is provided and returns `false` for the
given error, in which case the original error is kept.

#### Parameters

##### error

`unknown`

#### Returns

`boolean`
