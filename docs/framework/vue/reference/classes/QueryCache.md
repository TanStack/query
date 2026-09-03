---
id: QueryCache
title: QueryCache
---

Defined in: [vue-query/src/queryCache.ts:16](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryCache.ts#L16)

Vue-aware subclass of `@tanstack/query-core`'s `QueryCache`. `find`/`findAll` also accept a
MaybeRefDeep filters object, so `ref`s can be passed directly without unwrapping. Access it via
`queryClient.getQueryCache()` — `QueryClient` constructs one of these by default.

## Extends

- `QueryCache`

## Constructors

### Constructor

```ts
new QueryCache(config?): QueryCache;
```

Defined in: query-core/dist-ts/src/queryCache.d.ts:57

#### Parameters

##### config?

`QueryCacheConfig`

#### Returns

`QueryCache`

#### Inherited from

```ts
QC.constructor
```

## Methods

### find()

```ts
find<TQueryFnData, TError, TData>(filters): 
  | Query<TQueryFnData, TError, TData, readonly unknown[]>
  | undefined;
```

Defined in: [vue-query/src/queryCache.ts:17](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryCache.ts#L17)

#### Type Parameters

##### TQueryFnData

`TQueryFnData` = `unknown`

##### TError

`TError` = `Error`

##### TData

`TData` = `TQueryFnData`

#### Parameters

##### filters

`MaybeRefDeep`\<`WithRequired`\<`QueryFilters`\<readonly `unknown`[]\>, `"queryKey"`\>\>

#### Returns

  \| `Query`\<`TQueryFnData`, `TError`, `TData`, readonly `unknown`[]\>
  \| `undefined`

#### Overrides

```ts
QC.find
```

***

### findAll()

```ts
findAll(filters): Query<unknown, Error, unknown, readonly unknown[]>[];
```

Defined in: [vue-query/src/queryCache.ts:23](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryCache.ts#L23)

#### Parameters

##### filters

`MaybeRefDeep`\<`QueryFilters`\<readonly `unknown`[]\>\> = `{}`

#### Returns

`Query`\<`unknown`, `Error`, `unknown`, readonly `unknown`[]\>[]

#### Overrides

```ts
QC.findAll
```
