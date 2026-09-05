---
id: MutationCache
title: MutationCache
---

Defined in: [vue-query/src/mutationCache.ts:15](https://github.com/TanStack/query/blob/main/packages/vue-query/src/mutationCache.ts#L15)

Vue-aware subclass of `@tanstack/query-core`'s `MutationCache`. `find`/`findAll` also accept a
MaybeRefDeep filters object, so `ref`s can be passed directly without unwrapping. Access it via
`queryClient.getMutationCache()` — `QueryClient` constructs one of these by default.

## Extends

- `MutationCache`

## Constructors

### Constructor

```ts
new MutationCache(config?): MutationCache;
```

Defined in: query-core/dist-ts/src/mutationCache.d.ts:47

#### Parameters

##### config?

`MutationCacheConfig`

#### Returns

`MutationCache`

#### Inherited from

```ts
MC.constructor
```

## Methods

### find()

```ts
find<TData, TError, TVariables, TOnMutateResult>(filters): 
  | Mutation<TData, TError, TVariables, TOnMutateResult>
  | undefined;
```

Defined in: [vue-query/src/mutationCache.ts:16](https://github.com/TanStack/query/blob/main/packages/vue-query/src/mutationCache.ts#L16)

#### Type Parameters

##### TData

`TData` = `unknown`

##### TError

`TError` = `Error`

##### TVariables

`TVariables` = `any`

##### TOnMutateResult

`TOnMutateResult` = `unknown`

#### Parameters

##### filters

`MaybeRefDeep`\<`MutationFilters`\<`unknown`, `Error`, `unknown`, `unknown`\>\>

#### Returns

  \| `Mutation`\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>
  \| `undefined`

#### Overrides

```ts
MC.find
```

***

### findAll()

```ts
findAll(filters): Mutation<unknown, Error, unknown, unknown>[];
```

Defined in: [vue-query/src/mutationCache.ts:27](https://github.com/TanStack/query/blob/main/packages/vue-query/src/mutationCache.ts#L27)

#### Parameters

##### filters

`MaybeRefDeep`\<`MutationFilters`\<`unknown`, `Error`, `unknown`, `unknown`\>\> = `{}`

#### Returns

`Mutation`\<`unknown`, `Error`, `unknown`, `unknown`\>[]

#### Overrides

```ts
MC.findAll
```
