---
id: QueryClient
title: QueryClient
---

Defined in: [vue-query/src/queryClient.ts:44](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryClient.ts#L44)

Vue-aware subclass of `@tanstack/query-core`'s `QueryClient`. Methods that accept `options` (such as
`CancelOptions` or `InvalidateOptions`) or filters (such as the `QueryFilters` accepted by
`invalidateQueries`) also accept a MaybeRefDeep version of it, so you can pass `ref`s directly
without unwrapping them yourself — e.g. `queryClient.invalidateQueries({ queryKey: ['post', myRef] })`.
Install one on your app with `VueQueryPlugin`, or retrieve it with `useQueryClient`.

## Extends

- `QueryClient`

## Constructors

### Constructor

```ts
new QueryClient(config): QueryClient;
```

Defined in: [vue-query/src/queryClient.ts:45](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryClient.ts#L45)

#### Parameters

##### config

`QueryClientConfig` = `{}`

#### Returns

`QueryClient`

#### Overrides

```ts
QC.constructor
```

## Properties

### isRestoring?

```ts
optional isRestoring: Ref<boolean, boolean>;
```

Defined in: [vue-query/src/queryClient.ts:58](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryClient.ts#L58)

`true` while a `clientPersister` passed to `VueQueryPlugin` is restoring the cache. Queries don't fetch
while this is `true`. Defaults to `false` if no persister is configured.

## Methods

### cancelQueries()

```ts
cancelQueries<TTaggedQueryKey>(filters?, options?): Promise<void>;
```

Defined in: [vue-query/src/queryClient.ts:185](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryClient.ts#L185)

#### Type Parameters

##### TTaggedQueryKey

`TTaggedQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

#### Parameters

##### filters?

`QueryFilters`\<`TTaggedQueryKey`\>

##### options?

`MaybeRefDeep`\<`CancelOptions`\>

#### Returns

`Promise`\<`void`\>

#### Overrides

```ts
QC.cancelQueries
```

***

### ~~ensureQueryData()~~

#### Call Signature

```ts
ensureQueryData<TQueryFnData, TError, TData, TQueryKey>(options): Promise<TData>;
```

Defined in: [vue-query/src/queryClient.ts:83](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryClient.ts#L83)

##### Type Parameters

###### TQueryFnData

`TQueryFnData`

###### TError

`TError` = `Error`

###### TData

`TData` = `TQueryFnData`

###### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

##### Parameters

###### options

`EnsureQueryDataOptions`\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

##### Returns

`Promise`\<`TData`\>

##### Deprecated

Use queryClient.query({ ...options, staleTime: 'static' }) instead. This method will be removed in the next major version.

##### Overrides

```ts
QC.ensureQueryData
```

#### Call Signature

```ts
ensureQueryData<TQueryFnData, TError, TData, TQueryKey>(options): Promise<TData>;
```

Defined in: [vue-query/src/queryClient.ts:91](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryClient.ts#L91)

##### Type Parameters

###### TQueryFnData

`TQueryFnData`

###### TError

`TError` = `Error`

###### TData

`TData` = `TQueryFnData`

###### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

##### Parameters

###### options

`MaybeRefDeep`\<`EnsureQueryDataOptions`\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `never`\>\>

##### Returns

`Promise`\<`TData`\>

##### Deprecated

Use queryClient.query({ ...options, staleTime: 'static' }) instead. This method will be removed in the next major version.

##### Overrides

```ts
QC.ensureQueryData
```

***

### ~~fetchInfiniteQuery()~~

#### Call Signature

```ts
fetchInfiniteQuery<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options): Promise<InfiniteData<TData, TPageParam>>;
```

Defined in: [vue-query/src/queryClient.ts:464](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryClient.ts#L464)

##### Type Parameters

###### TQueryFnData

`TQueryFnData` = `unknown`

###### TError

`TError` = `Error`

###### TData

`TData` = `TQueryFnData`

###### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

###### TPageParam

`TPageParam` = `unknown`

##### Parameters

###### options

`FetchInfiniteQueryOptions`\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

##### Returns

`Promise`\<`InfiniteData`\<`TData`, `TPageParam`\>\>

##### Deprecated

Use queryClient.infiniteQuery(options) instead. This method will be removed in the next major version.

##### Overrides

```ts
QC.fetchInfiniteQuery
```

#### Call Signature

```ts
fetchInfiniteQuery<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options): Promise<InfiniteData<TData, TPageParam>>;
```

Defined in: [vue-query/src/queryClient.ts:479](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryClient.ts#L479)

##### Type Parameters

###### TQueryFnData

`TQueryFnData`

###### TError

`TError` = `Error`

###### TData

`TData` = `TQueryFnData`

###### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

###### TPageParam

`TPageParam` = `unknown`

##### Parameters

###### options

`MaybeRefDeep`\<`FetchInfiniteQueryOptions`\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>\>

##### Returns

`Promise`\<`InfiniteData`\<`TData`, `TPageParam`\>\>

##### Deprecated

Use queryClient.infiniteQuery(options) instead. This method will be removed in the next major version.

##### Overrides

```ts
QC.fetchInfiniteQuery
```

***

### ~~fetchQuery()~~

#### Call Signature

```ts
fetchQuery<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options): Promise<TData>;
```

Defined in: [vue-query/src/queryClient.ts:313](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryClient.ts#L313)

##### Type Parameters

###### TQueryFnData

`TQueryFnData`

###### TError

`TError` = `Error`

###### TData

`TData` = `TQueryFnData`

###### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

###### TPageParam

`TPageParam` = `never`

##### Parameters

###### options

`FetchQueryOptions`\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

##### Returns

`Promise`\<`TData`\>

##### Deprecated

Use queryClient.query(options) instead. This method will be removed in the next major version.

##### Overrides

```ts
QC.fetchQuery
```

#### Call Signature

```ts
fetchQuery<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options): Promise<TData>;
```

Defined in: [vue-query/src/queryClient.ts:328](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryClient.ts#L328)

##### Type Parameters

###### TQueryFnData

`TQueryFnData`

###### TError

`TError` = `Error`

###### TData

`TData` = `TQueryFnData`

###### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

###### TPageParam

`TPageParam` = `never`

##### Parameters

###### options

`MaybeRefDeep`\<`FetchQueryOptions`\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>\> | () => `FetchQueryOptions`\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

##### Returns

`Promise`\<`TData`\>

##### Deprecated

Use queryClient.query(options) instead. This method will be removed in the next major version.

##### Overrides

```ts
QC.fetchQuery
```

***

### getMutationDefaults()

```ts
getMutationDefaults(mutationKey): MutationObserverOptions<any, any, any, any>;
```

Defined in: [vue-query/src/queryClient.ts:612](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryClient.ts#L612)

#### Parameters

##### mutationKey

`MaybeRefDeep`\<readonly `unknown`[]\>

#### Returns

`MutationObserverOptions`\<`any`, `any`, `any`, `any`\>

#### Overrides

```ts
QC.getMutationDefaults
```

***

### getQueriesData()

```ts
getQueriesData<TData>(filters): [readonly unknown[], TData | undefined][];
```

Defined in: [vue-query/src/queryClient.ts:114](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryClient.ts#L114)

#### Type Parameters

##### TData

`TData` = `unknown`

#### Parameters

##### filters

`MaybeRefDeep`\<`QueryFilters`\<readonly `unknown`[]\>\>

#### Returns

\[readonly `unknown`[], `TData` \| `undefined`\][]

#### Overrides

```ts
QC.getQueriesData
```

***

### getQueryData()

#### Call Signature

```ts
getQueryData<TData, TTaggedQueryKey>(queryKey): InferDataFromTag<TData, TTaggedQueryKey> | undefined;
```

Defined in: [vue-query/src/queryClient.ts:68](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryClient.ts#L68)

Imperative (non-reactive) way to retrieve data for a QueryKey.
Should only be used in callbacks or functions where reading the latest data is necessary, e.g. for optimistic updates.

Hint: Do not use this function inside a component, because it won't receive updates.
Use `useQuery` to create a `QueryObserver` that subscribes to changes.

##### Type Parameters

###### TData

`TData` = `unknown`

###### TTaggedQueryKey

`TTaggedQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

##### Parameters

###### queryKey

`TTaggedQueryKey`

##### Returns

`InferDataFromTag`\<`TData`, `TTaggedQueryKey`\> \| `undefined`

##### Overrides

```ts
QC.getQueryData
```

#### Call Signature

```ts
getQueryData<TData>(queryKey): TData | undefined;
```

Defined in: [vue-query/src/queryClient.ts:71](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryClient.ts#L71)

##### Type Parameters

###### TData

`TData` = `unknown`

##### Parameters

###### queryKey

`MaybeRefDeep`\<readonly `unknown`[]\>

##### Returns

`TData` \| `undefined`

##### Overrides

```ts
QC.getQueryData
```

***

### getQueryDefaults()

```ts
getQueryDefaults(queryKey): OmitKeyof<QueryObserverOptions<any, any, any, any, any>, "queryKey">;
```

Defined in: [vue-query/src/queryClient.ts:589](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryClient.ts#L589)

#### Parameters

##### queryKey

`MaybeRefDeep`\<readonly `unknown`[]\>

#### Returns

`OmitKeyof`\<`QueryObserverOptions`\<`any`, `any`, `any`, `any`, `any`\>, `"queryKey"`\>

#### Overrides

```ts
QC.getQueryDefaults
```

***

### getQueryState()

```ts
getQueryState<TData, TError>(queryKey): QueryState<TData, TError> | undefined;
```

Defined in: [vue-query/src/queryClient.ts:161](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryClient.ts#L161)

#### Type Parameters

##### TData

`TData` = `unknown`

##### TError

`TError` = `Error`

#### Parameters

##### queryKey

`MaybeRefDeep`\<readonly `unknown`[]\>

#### Returns

`QueryState`\<`TData`, `TError`\> \| `undefined`

#### Overrides

```ts
QC.getQueryState
```

***

### infiniteQuery()

#### Call Signature

```ts
infiniteQuery<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options): Promise<TData[] extends InfiniteData<TQueryFnData, unknown>[] ? InfiniteData<TQueryFnData, TPageParam> : TData>;
```

Defined in: [vue-query/src/queryClient.ts:397](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryClient.ts#L397)

##### Type Parameters

###### TQueryFnData

`TQueryFnData` = `unknown`

###### TError

`TError` = `Error`

###### TData

`TData` = `InfiniteData`\<`TQueryFnData`, `unknown`\>

###### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

###### TPageParam

`TPageParam` = `unknown`

##### Parameters

###### options

`InfiniteQueryExecuteOptions`\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

##### Returns

`Promise`\<`TData`[] *extends* `InfiniteData`\<`TQueryFnData`, `unknown`\>[] ? `InfiniteData`\<`TQueryFnData`, `TPageParam`\> : `TData`\>

##### Overrides

```ts
QC.infiniteQuery
```

#### Call Signature

```ts
infiniteQuery<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options): Promise<TData[] extends InfiniteData<TQueryFnData, unknown>[] ? InfiniteData<TQueryFnData, TPageParam> : TData>;
```

Defined in: [vue-query/src/queryClient.ts:416](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryClient.ts#L416)

##### Type Parameters

###### TQueryFnData

`TQueryFnData` = `unknown`

###### TError

`TError` = `Error`

###### TData

`TData` = `InfiniteData`\<`TQueryFnData`, `unknown`\>

###### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

###### TPageParam

`TPageParam` = `unknown`

##### Parameters

###### options

`MaybeRefDeep`\<`InfiniteQueryExecuteOptions`\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>\>

##### Returns

`Promise`\<`TData`[] *extends* `InfiniteData`\<`TQueryFnData`, `unknown`\>[] ? `InfiniteData`\<`TQueryFnData`, `TPageParam`\> : `TData`\>

##### Overrides

```ts
QC.infiniteQuery
```

***

### invalidateQueries()

```ts
invalidateQueries<TTaggedQueryKey>(filters?, options?): Promise<void>;
```

Defined in: [vue-query/src/queryClient.ts:196](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryClient.ts#L196)

#### Type Parameters

##### TTaggedQueryKey

`TTaggedQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

#### Parameters

##### filters?

`InvalidateQueryFilters`\<`TTaggedQueryKey`\> | () => `InvalidateQueryFilters`\<`TTaggedQueryKey`\>

##### options?

`MaybeRefDeep`\<`InvalidateOptions`\>

#### Returns

`Promise`\<`void`\>

#### Overrides

```ts
QC.invalidateQueries
```

***

### isFetching()

```ts
isFetching(filters): number;
```

Defined in: [vue-query/src/queryClient.ts:60](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryClient.ts#L60)

#### Parameters

##### filters

`MaybeRefDeep`\<`QueryFilters`\<readonly `unknown`[]\>\> = `{}`

#### Returns

`number`

#### Overrides

```ts
QC.isFetching
```

***

### isMutating()

```ts
isMutating(filters): number;
```

Defined in: [vue-query/src/queryClient.ts:64](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryClient.ts#L64)

#### Parameters

##### filters

`MaybeRefDeep`\<`MutationFilters`\<`unknown`, `Error`, `unknown`, `unknown`\>\> = `{}`

#### Returns

`number`

#### Overrides

```ts
QC.isMutating
```

***

### ~~prefetchInfiniteQuery()~~

#### Call Signature

```ts
prefetchInfiniteQuery<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options): Promise<void>;
```

Defined in: [vue-query/src/queryClient.ts:519](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryClient.ts#L519)

##### Type Parameters

###### TQueryFnData

`TQueryFnData`

###### TError

`TError` = `Error`

###### TData

`TData` = `TQueryFnData`

###### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

###### TPageParam

`TPageParam` = `unknown`

##### Parameters

###### options

`FetchInfiniteQueryOptions`\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

##### Returns

`Promise`\<`void`\>

##### Deprecated

use void queryClient.infiniteQuery(options) instead. You can swallow errors with `.catch(noop)`. This method will be removed in the next major version.

##### Overrides

```ts
QC.prefetchInfiniteQuery
```

#### Call Signature

```ts
prefetchInfiniteQuery<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options): Promise<void>;
```

Defined in: [vue-query/src/queryClient.ts:534](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryClient.ts#L534)

##### Type Parameters

###### TQueryFnData

`TQueryFnData`

###### TError

`TError` = `Error`

###### TData

`TData` = `TQueryFnData`

###### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

###### TPageParam

`TPageParam` = `unknown`

##### Parameters

###### options

`MaybeRefDeep`\<`FetchInfiniteQueryOptions`\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>\>

##### Returns

`Promise`\<`void`\>

##### Deprecated

use void queryClient.infiniteQuery(options) instead. You can swallow errors with `.catch(noop)`. This method will be removed in the next major version.

##### Overrides

```ts
QC.prefetchInfiniteQuery
```

***

### ~~prefetchQuery()~~

#### Call Signature

```ts
prefetchQuery<TQueryFnData, TError, TData, TQueryKey>(options): Promise<void>;
```

Defined in: [vue-query/src/queryClient.ts:364](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryClient.ts#L364)

##### Type Parameters

###### TQueryFnData

`TQueryFnData` = `unknown`

###### TError

`TError` = `Error`

###### TData

`TData` = `TQueryFnData`

###### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

##### Parameters

###### options

`FetchQueryOptions`\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

##### Returns

`Promise`\<`void`\>

##### Deprecated

Use queryClient.query(options) instead. You can swallow errors with `.catch(noop)`. This method will be removed in the next major version.

##### Overrides

```ts
QC.prefetchQuery
```

#### Call Signature

```ts
prefetchQuery<TQueryFnData, TError, TData, TQueryKey>(options): Promise<void>;
```

Defined in: [vue-query/src/queryClient.ts:372](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryClient.ts#L372)

##### Type Parameters

###### TQueryFnData

`TQueryFnData` = `unknown`

###### TError

`TError` = `Error`

###### TData

`TData` = `TQueryFnData`

###### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

##### Parameters

###### options

`MaybeRefDeep`\<`FetchQueryOptions`\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `never`\>\>

##### Returns

`Promise`\<`void`\>

##### Deprecated

Use queryClient.query(options) instead. You can swallow errors with `.catch(noop)`. This method will be removed in the next major version.

##### Overrides

```ts
QC.prefetchQuery
```

***

### query()

#### Call Signature

```ts
query<TQueryFnData, TError, TData, TQueryData, TQueryKey, TPageParam>(options): Promise<TData>;
```

Defined in: [vue-query/src/queryClient.ts:252](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryClient.ts#L252)

##### Type Parameters

###### TQueryFnData

`TQueryFnData`

###### TError

`TError` = `Error`

###### TData

`TData` = `TQueryFnData`

###### TQueryData

`TQueryData` = `TQueryFnData`

###### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

###### TPageParam

`TPageParam` = `never`

##### Parameters

###### options

`QueryExecuteOptions`\<`TQueryFnData`, `TError`, `TData`, `TQueryData`, `TQueryKey`, `TPageParam`\>

##### Returns

`Promise`\<`TData`\>

##### Overrides

```ts
QC.query
```

#### Call Signature

```ts
query<TQueryFnData, TError, TData, TQueryData, TQueryKey, TPageParam>(options): Promise<TData>;
```

Defined in: [vue-query/src/queryClient.ts:269](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryClient.ts#L269)

##### Type Parameters

###### TQueryFnData

`TQueryFnData`

###### TError

`TError` = `Error`

###### TData

`TData` = `TQueryFnData`

###### TQueryData

`TQueryData` = `TQueryFnData`

###### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

###### TPageParam

`TPageParam` = `never`

##### Parameters

###### options

`MaybeRefDeep`\<`QueryExecuteOptions`\<`TQueryFnData`, `TError`, `TData`, `TQueryData`, `TQueryKey`, `TPageParam`\>\>

##### Returns

`Promise`\<`TData`\>

##### Overrides

```ts
QC.query
```

***

### refetchQueries()

```ts
refetchQueries<TTaggedQueryKey>(filters?, options?): Promise<void>;
```

Defined in: [vue-query/src/queryClient.ts:236](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryClient.ts#L236)

#### Type Parameters

##### TTaggedQueryKey

`TTaggedQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

#### Parameters

##### filters?

`RefetchQueryFilters`\<`TTaggedQueryKey`\>

##### options?

`MaybeRefDeep`\<`RefetchOptions`\>

#### Returns

`Promise`\<`void`\>

#### Overrides

```ts
QC.refetchQueries
```

***

### removeQueries()

```ts
removeQueries<TTaggedQueryKey>(filters?): void;
```

Defined in: [vue-query/src/queryClient.ts:167](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryClient.ts#L167)

#### Type Parameters

##### TTaggedQueryKey

`TTaggedQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

#### Parameters

##### filters?

`QueryFilters`\<`TTaggedQueryKey`\>

#### Returns

`void`

#### Overrides

```ts
QC.removeQueries
```

***

### resetQueries()

```ts
resetQueries<TTaggedQueryKey>(filters?, options?): Promise<void>;
```

Defined in: [vue-query/src/queryClient.ts:174](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryClient.ts#L174)

#### Type Parameters

##### TTaggedQueryKey

`TTaggedQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

#### Parameters

##### filters?

`QueryFilters`\<`TTaggedQueryKey`\>

##### options?

`MaybeRefDeep`\<`ResetOptions`\>

#### Returns

`Promise`\<`void`\>

#### Overrides

```ts
QC.resetQueries
```

***

### setDefaultOptions()

```ts
setDefaultOptions(options): void;
```

Defined in: [vue-query/src/queryClient.ts:571](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryClient.ts#L571)

#### Parameters

##### options

`MaybeRefDeep`\<`DefaultOptions`\<`Error`\>\>

#### Returns

`void`

#### Overrides

```ts
QC.setDefaultOptions
```

***

### setMutationDefaults()

```ts
setMutationDefaults<TData, TError, TVariables, TOnMutateResult>(mutationKey, options): void;
```

Defined in: [vue-query/src/queryClient.ts:595](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryClient.ts#L595)

#### Type Parameters

##### TData

`TData` = `unknown`

##### TError

`TError` = `Error`

##### TVariables

`TVariables` = `void`

##### TOnMutateResult

`TOnMutateResult` = `unknown`

#### Parameters

##### mutationKey

`MaybeRefDeep`\<readonly `unknown`[]\>

##### options

`MaybeRefDeep`\<`MutationObserverOptions`\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>\>

#### Returns

`void`

#### Overrides

```ts
QC.setMutationDefaults
```

***

### setQueriesData()

```ts
setQueriesData<TData>(
   filters, 
   updater, 
   options): [readonly unknown[], TData | undefined][];
```

Defined in: [vue-query/src/queryClient.ts:149](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryClient.ts#L149)

#### Type Parameters

##### TData

`TData`

#### Parameters

##### filters

`MaybeRefDeep`\<`QueryFilters`\<readonly `unknown`[]\>\>

##### updater

`Updater`\<`TData` \| `undefined`, `TData` \| `undefined`\>

##### options

`MaybeRefDeep`\<`SetDataOptions`\> = `{}`

#### Returns

\[readonly `unknown`[], `TData` \| `undefined`\][]

#### Overrides

```ts
QC.setQueriesData
```

***

### setQueryData()

#### Call Signature

```ts
setQueryData<TQueryFnData, TTaggedQueryKey, TInferredQueryFnData>(
   queryKey, 
   updater, 
   options?): NoInfer<TInferredQueryFnData> | undefined;
```

Defined in: [vue-query/src/queryClient.ts:120](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryClient.ts#L120)

##### Type Parameters

###### TQueryFnData

`TQueryFnData` = `unknown`

###### TTaggedQueryKey

`TTaggedQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

###### TInferredQueryFnData

`TInferredQueryFnData` = `InferDataFromTag`\<`TQueryFnData`, `TTaggedQueryKey`\>

##### Parameters

###### queryKey

`TTaggedQueryKey`

###### updater

`Updater`\<`NoInfer`\<`TInferredQueryFnData`\> \| `undefined`, `NoInfer`\<`TInferredQueryFnData`\> \| `undefined`\>

###### options?

`MaybeRefDeep`\<`SetDataOptions`\>

##### Returns

`NoInfer`\<`TInferredQueryFnData`\> \| `undefined`

##### Overrides

```ts
QC.setQueryData
```

#### Call Signature

```ts
setQueryData<TQueryFnData, TData>(
   queryKey, 
   updater, 
   options?): NoInfer<TData> | undefined;
```

Defined in: [vue-query/src/queryClient.ts:132](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryClient.ts#L132)

##### Type Parameters

###### TQueryFnData

`TQueryFnData`

###### TData

`TData` = `NoUnknown`\<`TQueryFnData`\>

##### Parameters

###### queryKey

`MaybeRefDeep`\<readonly `unknown`[]\>

###### updater

`Updater`\<`NoInfer`\<`TData`\> \| `undefined`, `NoInfer`\<`TData`\> \| `undefined`\>

###### options?

`MaybeRefDeep`\<`SetDataOptions`\>

##### Returns

`NoInfer`\<`TData`\> \| `undefined`

##### Overrides

```ts
QC.setQueryData
```

***

### setQueryDefaults()

```ts
setQueryDefaults<TQueryFnData, TError, TData, TQueryData>(queryKey, options): void;
```

Defined in: [vue-query/src/queryClient.ts:575](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryClient.ts#L575)

#### Type Parameters

##### TQueryFnData

`TQueryFnData` = `unknown`

##### TError

`TError` = `Error`

##### TData

`TData` = `TQueryFnData`

##### TQueryData

`TQueryData` = `TQueryFnData`

#### Parameters

##### queryKey

`MaybeRefDeep`\<readonly `unknown`[]\>

##### options

`MaybeRefDeep`\<`Omit`\<[`UseQueryOptions`](../type-aliases/UseQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryData`\>, `"queryKey"`\>\>

#### Returns

`void`

#### Overrides

```ts
QC.setQueryDefaults
```
