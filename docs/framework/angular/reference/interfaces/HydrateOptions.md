---
id: HydrateOptions
title: HydrateOptions
---

Defined in: [packages/query-core/src/hydration.ts:61](https://github.com/TanStack/query/blob/main/packages/query-core/src/hydration.ts#L61)

Options for `hydrate`, controlling the default options applied to queries/mutations restored from a
`DehydratedState`, and how to reverse any transformation applied by `DehydrateOptions.serializeData`.

## Properties

### defaultOptions?

```ts
optional defaultOptions: object;
```

Defined in: [packages/query-core/src/hydration.ts:62](https://github.com/TanStack/query/blob/main/packages/query-core/src/hydration.ts#L62)

#### deserializeData?

```ts
optional deserializeData: TransformerFn;
```

Transforms a query's `data` after it is read from the dehydrated state, reversing `serializeData`.

#### mutations?

```ts
optional mutations: MutationOptions<unknown, Error, unknown, unknown>;
```

Default options merged into every mutation restored from the dehydrated state.

#### queries?

```ts
optional queries: QueryOptions<unknown, Error, unknown, readonly unknown[], never>;
```

Default options merged into every query restored from the dehydrated state.
