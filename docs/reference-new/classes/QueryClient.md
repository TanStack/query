---
id: QueryClient
title: QueryClient
---

# Class: QueryClient

Defined in: [packages/query-core/src/queryClient.ts:61](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryClient.ts#L61)

## Constructors

### Constructor

```ts
new QueryClient(config): QueryClient;
```

Defined in: [packages/query-core/src/queryClient.ts:71](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryClient.ts#L71)

#### Parameters

##### config

[`QueryClientConfig`](../interfaces/QueryClientConfig.md) = `{}`

#### Returns

`QueryClient`

## Methods

### cancelQueries()

```ts
cancelQueries<TTaggedQueryKey>(filters?, cancelOptions?): Promise<void>;
```

Defined in: [packages/query-core/src/queryClient.ts:278](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryClient.ts#L278)

#### Type Parameters

##### TTaggedQueryKey

`TTaggedQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

#### Parameters

##### filters?

[`QueryFilters`](../interfaces/QueryFilters.md)\<`TTaggedQueryKey`\>

##### cancelOptions?

[`CancelOptions`](../interfaces/CancelOptions.md) = `{}`

#### Returns

`Promise`\<`void`\>

***

### clear()

```ts
clear(): void;
```

Defined in: [packages/query-core/src/queryClient.ts:644](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryClient.ts#L644)

#### Returns

`void`

***

### defaultMutationOptions()

```ts
defaultMutationOptions<T>(options?): T;
```

Defined in: [packages/query-core/src/queryClient.ts:629](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryClient.ts#L629)

#### Type Parameters

##### T

`T` *extends* [`MutationOptions`](../interfaces/MutationOptions.md)\<`any`, `any`, `any`, `any`\>

#### Parameters

##### options?

`T`

#### Returns

`T`

***

### defaultQueryOptions()

```ts
defaultQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey, TPageParam>(options): DefaultedQueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>;
```

Defined in: [packages/query-core/src/queryClient.ts:548](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryClient.ts#L548)

#### Type Parameters

##### TQueryFnData

`TQueryFnData` = `unknown`

##### TError

`TError` = `Error`

##### TData

`TData` = `TQueryFnData`

##### TQueryData

`TQueryData` = `TQueryFnData`

##### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

##### TPageParam

`TPageParam` = `never`

#### Parameters

##### options

[`QueryObserverOptions`](../interfaces/QueryObserverOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryData`, `TQueryKey`, `TPageParam`\> | [`DefaultedQueryObserverOptions`](../type-aliases/DefaultedQueryObserverOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryData`, `TQueryKey`\>

#### Returns

[`DefaultedQueryObserverOptions`](../type-aliases/DefaultedQueryObserverOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryData`, `TQueryKey`\>

***

### ensureInfiniteQueryData()

```ts
ensureInfiniteQueryData<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options): Promise<InfiniteData<TData, TPageParam>>;
```

Defined in: [packages/query-core/src/queryClient.ts:425](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryClient.ts#L425)

#### Type Parameters

##### TQueryFnData

`TQueryFnData`

##### TError

`TError` = `Error`

##### TData

`TData` = `TQueryFnData`

##### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

##### TPageParam

`TPageParam` = `unknown`

#### Parameters

##### options

[`EnsureInfiniteQueryDataOptions`](../type-aliases/EnsureInfiniteQueryDataOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

#### Returns

`Promise`\<[`InfiniteData`](../interfaces/InfiniteData.md)\<`TData`, `TPageParam`\>\>

***

### ensureQueryData()

```ts
ensureQueryData<TQueryFnData, TError, TData, TQueryKey>(options): Promise<TData>;
```

Defined in: [packages/query-core/src/queryClient.ts:140](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryClient.ts#L140)

#### Type Parameters

##### TQueryFnData

`TQueryFnData`

##### TError

`TError` = `Error`

##### TData

`TData` = `TQueryFnData`

##### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

#### Parameters

##### options

[`EnsureQueryDataOptions`](../interfaces/EnsureQueryDataOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

#### Returns

`Promise`\<`TData`\>

***

### fetchInfiniteQuery()

```ts
fetchInfiniteQuery<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options): Promise<InfiniteData<TData, TPageParam>>;
```

Defined in: [packages/query-core/src/queryClient.ts:383](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryClient.ts#L383)

#### Type Parameters

##### TQueryFnData

`TQueryFnData`

##### TError

`TError` = `Error`

##### TData

`TData` = `TQueryFnData`

##### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

##### TPageParam

`TPageParam` = `unknown`

#### Parameters

##### options

[`FetchInfiniteQueryOptions`](../type-aliases/FetchInfiniteQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

#### Returns

`Promise`\<[`InfiniteData`](../interfaces/InfiniteData.md)\<`TData`, `TPageParam`\>\>

***

### fetchQuery()

```ts
fetchQuery<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options): Promise<TData>;
```

Defined in: [packages/query-core/src/queryClient.ts:341](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryClient.ts#L341)

#### Type Parameters

##### TQueryFnData

`TQueryFnData`

##### TError

`TError` = `Error`

##### TData

`TData` = `TQueryFnData`

##### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

##### TPageParam

`TPageParam` = `never`

#### Parameters

##### options

[`FetchQueryOptions`](../interfaces/FetchQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

#### Returns

`Promise`\<`TData`\>

***

### getDefaultOptions()

```ts
getDefaultOptions(): DefaultOptions;
```

Defined in: [packages/query-core/src/queryClient.ts:465](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryClient.ts#L465)

#### Returns

[`DefaultOptions`](../interfaces/DefaultOptions.md)

***

### getMutationCache()

```ts
getMutationCache(): MutationCache;
```

Defined in: [packages/query-core/src/queryClient.ts:461](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryClient.ts#L461)

#### Returns

[`MutationCache`](MutationCache.md)

***

### getMutationDefaults()

```ts
getMutationDefaults(mutationKey): OmitKeyof<MutationObserverOptions<any, any, any, any>, "mutationKey">;
```

Defined in: [packages/query-core/src/queryClient.ts:529](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryClient.ts#L529)

#### Parameters

##### mutationKey

readonly `unknown`[]

#### Returns

[`OmitKeyof`](../type-aliases/OmitKeyof.md)\<[`MutationObserverOptions`](../interfaces/MutationObserverOptions.md)\<`any`, `any`, `any`, `any`\>, `"mutationKey"`\>

***

### getQueriesData()

```ts
getQueriesData<TQueryFnData, TQueryFilters>(filters): [readonly unknown[], TQueryFnData | undefined][];
```

Defined in: [packages/query-core/src/queryClient.ts:166](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryClient.ts#L166)

#### Type Parameters

##### TQueryFnData

`TQueryFnData` = `unknown`

##### TQueryFilters

`TQueryFilters` *extends* [`QueryFilters`](../interfaces/QueryFilters.md)\<`any`\> = [`QueryFilters`](../interfaces/QueryFilters.md)\<readonly `unknown`[]\>

#### Parameters

##### filters

`TQueryFilters`

#### Returns

\[readonly `unknown`[], `TQueryFnData` \| `undefined`\][]

***

### getQueryCache()

```ts
getQueryCache(): QueryCache;
```

Defined in: [packages/query-core/src/queryClient.ts:457](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryClient.ts#L457)

#### Returns

[`QueryCache`](QueryCache.md)

***

### getQueryData()

```ts
getQueryData<TQueryFnData, TTaggedQueryKey, TInferredQueryFnData>(queryKey): TInferredQueryFnData | undefined;
```

Defined in: [packages/query-core/src/queryClient.ts:129](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryClient.ts#L129)

Imperative (non-reactive) way to retrieve data for a QueryKey.
Should only be used in callbacks or functions where reading the latest data is necessary, e.g. for optimistic updates.

Hint: Do not use this function inside a component, because it won't receive updates.
Use `useQuery` to create a `QueryObserver` that subscribes to changes.

#### Type Parameters

##### TQueryFnData

`TQueryFnData` = `unknown`

##### TTaggedQueryKey

`TTaggedQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

##### TInferredQueryFnData

`TInferredQueryFnData` = [`InferDataFromTag`](../type-aliases/InferDataFromTag.md)\<`TQueryFnData`, `TTaggedQueryKey`\>

#### Parameters

##### queryKey

`TTaggedQueryKey`

#### Returns

`TInferredQueryFnData` \| `undefined`

***

### getQueryDefaults()

```ts
getQueryDefaults(queryKey): OmitKeyof<QueryObserverOptions<any, any, any, any, any>, "queryKey">;
```

Defined in: [packages/query-core/src/queryClient.ts:493](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryClient.ts#L493)

#### Parameters

##### queryKey

readonly `unknown`[]

#### Returns

[`OmitKeyof`](../type-aliases/OmitKeyof.md)\<[`QueryObserverOptions`](../interfaces/QueryObserverOptions.md)\<`any`, `any`, `any`, `any`, `any`\>, `"queryKey"`\>

***

### getQueryState()

```ts
getQueryState<TQueryFnData, TError, TTaggedQueryKey, TInferredQueryFnData, TInferredError>(queryKey): 
  | QueryState<TInferredQueryFnData, TInferredError>
  | undefined;
```

Defined in: [packages/query-core/src/queryClient.ts:232](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryClient.ts#L232)

#### Type Parameters

##### TQueryFnData

`TQueryFnData` = `unknown`

##### TError

`TError` = `Error`

##### TTaggedQueryKey

`TTaggedQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

##### TInferredQueryFnData

`TInferredQueryFnData` = [`InferDataFromTag`](../type-aliases/InferDataFromTag.md)\<`TQueryFnData`, `TTaggedQueryKey`\>

##### TInferredError

`TInferredError` = [`InferErrorFromTag`](../type-aliases/InferErrorFromTag.md)\<`TError`, `TTaggedQueryKey`\>

#### Parameters

##### queryKey

`TTaggedQueryKey`

#### Returns

  \| [`QueryState`](../interfaces/QueryState.md)\<`TInferredQueryFnData`, `TInferredError`\>
  \| `undefined`

***

### invalidateQueries()

```ts
invalidateQueries<TTaggedQueryKey>(filters?, options?): Promise<void>;
```

Defined in: [packages/query-core/src/queryClient.ts:293](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryClient.ts#L293)

#### Type Parameters

##### TTaggedQueryKey

`TTaggedQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

#### Parameters

##### filters?

[`InvalidateQueryFilters`](../interfaces/InvalidateQueryFilters.md)\<`TTaggedQueryKey`\>

##### options?

[`InvalidateOptions`](../interfaces/InvalidateOptions.md) = `{}`

#### Returns

`Promise`\<`void`\>

***

### isFetching()

```ts
isFetching<TQueryFilters>(filters?): number;
```

Defined in: [packages/query-core/src/queryClient.ts:109](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryClient.ts#L109)

#### Type Parameters

##### TQueryFilters

`TQueryFilters` *extends* [`QueryFilters`](../interfaces/QueryFilters.md)\<`any`\> = [`QueryFilters`](../interfaces/QueryFilters.md)\<readonly `unknown`[]\>

#### Parameters

##### filters?

`TQueryFilters`

#### Returns

`number`

***

### isMutating()

```ts
isMutating<TMutationFilters>(filters?): number;
```

Defined in: [packages/query-core/src/queryClient.ts:116](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryClient.ts#L116)

#### Type Parameters

##### TMutationFilters

`TMutationFilters` *extends* [`MutationFilters`](../interfaces/MutationFilters.md)\<`any`, `any`, `unknown`, `unknown`\> = [`MutationFilters`](../interfaces/MutationFilters.md)\<`unknown`, `Error`, `unknown`, `unknown`\>

#### Parameters

##### filters?

`TMutationFilters`

#### Returns

`number`

***

### mount()

```ts
mount(): void;
```

Defined in: [packages/query-core/src/queryClient.ts:80](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryClient.ts#L80)

#### Returns

`void`

***

### prefetchInfiniteQuery()

```ts
prefetchInfiniteQuery<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options): Promise<void>;
```

Defined in: [packages/query-core/src/queryClient.ts:407](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryClient.ts#L407)

#### Type Parameters

##### TQueryFnData

`TQueryFnData`

##### TError

`TError` = `Error`

##### TData

`TData` = `TQueryFnData`

##### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

##### TPageParam

`TPageParam` = `unknown`

#### Parameters

##### options

[`FetchInfiniteQueryOptions`](../type-aliases/FetchInfiniteQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

#### Returns

`Promise`\<`void`\>

***

### prefetchQuery()

```ts
prefetchQuery<TQueryFnData, TError, TData, TQueryKey>(options): Promise<void>;
```

Defined in: [packages/query-core/src/queryClient.ts:372](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryClient.ts#L372)

#### Type Parameters

##### TQueryFnData

`TQueryFnData` = `unknown`

##### TError

`TError` = `Error`

##### TData

`TData` = `TQueryFnData`

##### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

#### Parameters

##### options

[`FetchQueryOptions`](../interfaces/FetchQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

#### Returns

`Promise`\<`void`\>

***

### refetchQueries()

```ts
refetchQueries<TTaggedQueryKey>(filters?, options?): Promise<void>;
```

Defined in: [packages/query-core/src/queryClient.ts:315](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryClient.ts#L315)

#### Type Parameters

##### TTaggedQueryKey

`TTaggedQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

#### Parameters

##### filters?

[`RefetchQueryFilters`](../interfaces/RefetchQueryFilters.md)\<`TTaggedQueryKey`\>

##### options?

[`RefetchOptions`](../interfaces/RefetchOptions.md) = `{}`

#### Returns

`Promise`\<`void`\>

***

### removeQueries()

```ts
removeQueries<TTaggedQueryKey>(filters?): void;
```

Defined in: [packages/query-core/src/queryClient.ts:247](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryClient.ts#L247)

#### Type Parameters

##### TTaggedQueryKey

`TTaggedQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

#### Parameters

##### filters?

[`QueryFilters`](../interfaces/QueryFilters.md)\<`TTaggedQueryKey`\>

#### Returns

`void`

***

### resetQueries()

```ts
resetQueries<TTaggedQueryKey>(filters?, options?): Promise<void>;
```

Defined in: [packages/query-core/src/queryClient.ts:258](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryClient.ts#L258)

#### Type Parameters

##### TTaggedQueryKey

`TTaggedQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

#### Parameters

##### filters?

[`QueryFilters`](../interfaces/QueryFilters.md)\<`TTaggedQueryKey`\>

##### options?

[`ResetOptions`](../interfaces/ResetOptions.md)

#### Returns

`Promise`\<`void`\>

***

### resumePausedMutations()

```ts
resumePausedMutations(): Promise<unknown>;
```

Defined in: [packages/query-core/src/queryClient.ts:450](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryClient.ts#L450)

#### Returns

`Promise`\<`unknown`\>

***

### setDefaultOptions()

```ts
setDefaultOptions(options): void;
```

Defined in: [packages/query-core/src/queryClient.ts:469](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryClient.ts#L469)

#### Parameters

##### options

[`DefaultOptions`](../interfaces/DefaultOptions.md)

#### Returns

`void`

***

### setMutationDefaults()

```ts
setMutationDefaults<TData, TError, TVariables, TOnMutateResult>(mutationKey, options): void;
```

Defined in: [packages/query-core/src/queryClient.ts:511](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryClient.ts#L511)

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

readonly `unknown`[]

##### options

[`OmitKeyof`](../type-aliases/OmitKeyof.md)\<[`MutationObserverOptions`](../interfaces/MutationObserverOptions.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>, `"mutationKey"`\>

#### Returns

`void`

***

### setQueriesData()

```ts
setQueriesData<TQueryFnData, TQueryFilters>(
   filters, 
   updater, 
   options?): [readonly unknown[], TQueryFnData | undefined][];
```

Defined in: [packages/query-core/src/queryClient.ts:211](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryClient.ts#L211)

#### Type Parameters

##### TQueryFnData

`TQueryFnData`

##### TQueryFilters

`TQueryFilters` *extends* [`QueryFilters`](../interfaces/QueryFilters.md)\<`any`\> = [`QueryFilters`](../interfaces/QueryFilters.md)\<readonly `unknown`[]\>

#### Parameters

##### filters

`TQueryFilters`

##### updater

[`Updater`](../type-aliases/Updater.md)\<[`NoInfer`](../type-aliases/NoInfer.md)\<`TQueryFnData`\> \| `undefined`, [`NoInfer`](../type-aliases/NoInfer.md)\<`TQueryFnData`\> \| `undefined`\>

##### options?

[`SetDataOptions`](../interfaces/SetDataOptions.md)

#### Returns

\[readonly `unknown`[], `TQueryFnData` \| `undefined`\][]

***

### setQueryData()

```ts
setQueryData<TQueryFnData, TTaggedQueryKey, TInferredQueryFnData>(
   queryKey, 
   updater, 
   options?): 
  | NoInfer<TInferredQueryFnData>
  | undefined;
```

Defined in: [packages/query-core/src/queryClient.ts:176](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryClient.ts#L176)

#### Type Parameters

##### TQueryFnData

`TQueryFnData` = `unknown`

##### TTaggedQueryKey

`TTaggedQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

##### TInferredQueryFnData

`TInferredQueryFnData` = [`InferDataFromTag`](../type-aliases/InferDataFromTag.md)\<`TQueryFnData`, `TTaggedQueryKey`\>

#### Parameters

##### queryKey

`TTaggedQueryKey`

##### updater

[`Updater`](../type-aliases/Updater.md)\<
  \| [`NoInfer`](../type-aliases/NoInfer.md)\<`TInferredQueryFnData`\>
  \| `undefined`, 
  \| [`NoInfer`](../type-aliases/NoInfer.md)\<`TInferredQueryFnData`\>
  \| `undefined`\>

##### options?

[`SetDataOptions`](../interfaces/SetDataOptions.md)

#### Returns

  \| [`NoInfer`](../type-aliases/NoInfer.md)\<`TInferredQueryFnData`\>
  \| `undefined`

***

### setQueryDefaults()

```ts
setQueryDefaults<TQueryFnData, TError, TData, TQueryData>(queryKey, options): void;
```

Defined in: [packages/query-core/src/queryClient.ts:473](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryClient.ts#L473)

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

readonly `unknown`[]

##### options

`Partial`\<[`OmitKeyof`](../type-aliases/OmitKeyof.md)\<[`QueryObserverOptions`](../interfaces/QueryObserverOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryData`\>, `"queryKey"`\>\>

#### Returns

`void`

***

### unmount()

```ts
unmount(): void;
```

Defined in: [packages/query-core/src/queryClient.ts:98](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryClient.ts#L98)

#### Returns

`void`
