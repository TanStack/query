---
id: DehydrateOptions
title: DehydrateOptions
---

# Interface: DehydrateOptions

Defined in: [packages/query-core/src/hydration.ts:23](https://github.com/TanStack/query/blob/main/packages/query-core/src/hydration.ts#L23)

## Properties

### serializeData?

```ts
optional serializeData: TransformerFn;
```

Defined in: [packages/query-core/src/hydration.ts:24](https://github.com/TanStack/query/blob/main/packages/query-core/src/hydration.ts#L24)

***

### shouldDehydrateMutation()?

```ts
optional shouldDehydrateMutation: (mutation) => boolean;
```

Defined in: [packages/query-core/src/hydration.ts:25](https://github.com/TanStack/query/blob/main/packages/query-core/src/hydration.ts#L25)

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

Defined in: [packages/query-core/src/hydration.ts:26](https://github.com/TanStack/query/blob/main/packages/query-core/src/hydration.ts#L26)

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

Defined in: [packages/query-core/src/hydration.ts:27](https://github.com/TanStack/query/blob/main/packages/query-core/src/hydration.ts#L27)

#### Parameters

##### error

`unknown`

#### Returns

`boolean`
