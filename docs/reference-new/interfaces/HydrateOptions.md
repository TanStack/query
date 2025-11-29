---
id: HydrateOptions
title: HydrateOptions
---

# Interface: HydrateOptions

Defined in: [packages/query-core/src/hydration.ts:30](https://github.com/TanStack/query/blob/main/packages/query-core/src/hydration.ts#L30)

## Properties

### defaultOptions?

```ts
optional defaultOptions: object;
```

Defined in: [packages/query-core/src/hydration.ts:31](https://github.com/TanStack/query/blob/main/packages/query-core/src/hydration.ts#L31)

#### deserializeData?

```ts
optional deserializeData: TransformerFn;
```

#### mutations?

```ts
optional mutations: MutationOptions<unknown, Error, unknown, unknown>;
```

#### queries?

```ts
optional queries: QueryOptions<unknown, Error, unknown, readonly unknown[], never>;
```
