---
id: QueryClient
title: QueryClient
---

Defined in: [vue-query/src/queryClient.ts:43](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryClient.ts#L43)

Vue-aware subclass of `@tanstack/query-core`'s `QueryClient`. Every method that accepts a `queryKey` or
filters also accepts a MaybeRefDeep version of it, so you can pass `ref`s directly without unwrapping
them yourself — `queryClient.invalidateQueries({ queryKey: myRef })` works the same as passing the plain
value. Install one on your app with `VueQueryPlugin`, or retrieve it with `useQueryClient`.

## Extends

- `QueryClient`

## Constructors

### Constructor

```ts
new QueryClient(config): QueryClient;
```

Defined in: [vue-query/src/queryClient.ts:44](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryClient.ts#L44)

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

Defined in: [vue-query/src/queryClient.ts:57](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryClient.ts#L57)

`true` while a `clientPersister` passed to `VueQueryPlugin` is restoring the cache. Queries don't fetch
while this is `true`. `undefined` if no persister is configured.

## Methods

### cancelQueries()

```ts
cancelQueries<TTaggedQueryKey>(filters?, options?): Promise<void>;
```

Defined in: [vue-query/src/queryClient.ts:184](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryClient.ts#L184)

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

Defined in: [vue-query/src/queryClient.ts:82](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryClient.ts#L82)

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

Defined in: [vue-query/src/queryClient.ts:90](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryClient.ts#L90)

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

Defined in: [vue-query/src/queryClient.ts:463](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryClient.ts#L463)

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

Defined in: [vue-query/src/queryClient.ts:478](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryClient.ts#L478)

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

Defined in: [vue-query/src/queryClient.ts:312](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryClient.ts#L312)

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

Defined in: [vue-query/src/queryClient.ts:327](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryClient.ts#L327)

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

Defined in: [vue-query/src/queryClient.ts:611](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryClient.ts#L611)

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

Defined in: [vue-query/src/queryClient.ts:113](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryClient.ts#L113)

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

Defined in: [vue-query/src/queryClient.ts:67](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryClient.ts#L67)

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

Defined in: [vue-query/src/queryClient.ts:70](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryClient.ts#L70)

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

Defined in: [vue-query/src/queryClient.ts:588](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryClient.ts#L588)

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

Defined in: [vue-query/src/queryClient.ts:160](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryClient.ts#L160)

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

Defined in: [vue-query/src/queryClient.ts:396](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryClient.ts#L396)

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

Defined in: [vue-query/src/queryClient.ts:415](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryClient.ts#L415)

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

Defined in: [vue-query/src/queryClient.ts:195](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryClient.ts#L195)

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

Defined in: [vue-query/src/queryClient.ts:59](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryClient.ts#L59)

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

Defined in: [vue-query/src/queryClient.ts:63](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryClient.ts#L63)

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

Defined in: [vue-query/src/queryClient.ts:518](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryClient.ts#L518)

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

Defined in: [vue-query/src/queryClient.ts:533](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryClient.ts#L533)

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

Defined in: [vue-query/src/queryClient.ts:363](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryClient.ts#L363)

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

Defined in: [vue-query/src/queryClient.ts:371](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryClient.ts#L371)

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

Defined in: [vue-query/src/queryClient.ts:251](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryClient.ts#L251)

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

Defined in: [vue-query/src/queryClient.ts:268](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryClient.ts#L268)

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

Defined in: [vue-query/src/queryClient.ts:235](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryClient.ts#L235)

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

Defined in: [vue-query/src/queryClient.ts:166](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryClient.ts#L166)

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

Defined in: [vue-query/src/queryClient.ts:173](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryClient.ts#L173)

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

Defined in: [vue-query/src/queryClient.ts:570](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryClient.ts#L570)

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

Defined in: [vue-query/src/queryClient.ts:594](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryClient.ts#L594)

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

Defined in: [vue-query/src/queryClient.ts:148](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryClient.ts#L148)

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

Defined in: [vue-query/src/queryClient.ts:119](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryClient.ts#L119)

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

Defined in: [vue-query/src/queryClient.ts:131](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryClient.ts#L131)

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

Defined in: [vue-query/src/queryClient.ts:574](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryClient.ts#L574)

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
