---
id: Query
title: Query
---

# Class: Query\<TQueryFnData, TError, TData, TQueryKey\>

Defined in: [packages/query-core/src/query.ts:159](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L159)

## Extends

- `Removable`

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

### TError

`TError` = [`DefaultError`](../type-aliases/DefaultError.md)

### TData

`TData` = `TQueryFnData`

### TQueryKey

`TQueryKey` *extends* [`QueryKey`](../type-aliases/QueryKey.md) = [`QueryKey`](../type-aliases/QueryKey.md)

## Constructors

### Constructor

```ts
new Query<TQueryFnData, TError, TData, TQueryKey>(config): Query<TQueryFnData, TError, TData, TQueryKey>;
```

Defined in: [packages/query-core/src/query.ts:179](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L179)

#### Parameters

##### config

`QueryConfig`\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

#### Returns

`Query`\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

#### Overrides

```ts
Removable.constructor
```

## Properties

### gcTime

```ts
gcTime: number;
```

Defined in: [packages/query-core/src/removable.ts:6](https://github.com/TanStack/query/blob/main/packages/query-core/src/removable.ts#L6)

#### Inherited from

```ts
Removable.gcTime
```

***

### observers

```ts
observers: QueryObserver<any, any, any, any, any>[];
```

Defined in: [packages/query-core/src/query.ts:175](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L175)

***

### options

```ts
options: QueryOptions<TQueryFnData, TError, TData, TQueryKey>;
```

Defined in: [packages/query-core/src/query.ts:167](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L167)

***

### queryHash

```ts
queryHash: string;
```

Defined in: [packages/query-core/src/query.ts:166](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L166)

***

### queryKey

```ts
queryKey: TQueryKey;
```

Defined in: [packages/query-core/src/query.ts:165](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L165)

***

### state

```ts
state: QueryState<TData, TError>;
```

Defined in: [packages/query-core/src/query.ts:168](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L168)

## Accessors

### meta

#### Get Signature

```ts
get meta(): Record<string, unknown> | undefined;
```

Defined in: [packages/query-core/src/query.ts:194](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L194)

##### Returns

`Record`\<`string`, `unknown`\> \| `undefined`

***

### promise

#### Get Signature

```ts
get promise(): Promise<TData> | undefined;
```

Defined in: [packages/query-core/src/query.ts:198](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L198)

##### Returns

`Promise`\<`TData`\> \| `undefined`

## Methods

### addObserver()

```ts
addObserver(observer): void;
```

Defined in: [packages/query-core/src/query.ts:343](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L343)

#### Parameters

##### observer

[`QueryObserver`](QueryObserver.md)\<`any`, `any`, `any`, `any`, `any`\>

#### Returns

`void`

***

### cancel()

```ts
cancel(options?): Promise<void>;
```

Defined in: [packages/query-core/src/query.ts:251](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L251)

#### Parameters

##### options?

[`CancelOptions`](../interfaces/CancelOptions.md)

#### Returns

`Promise`\<`void`\>

***

### clearGcTimeout()

```ts
protected clearGcTimeout(): void;
```

Defined in: [packages/query-core/src/removable.ts:31](https://github.com/TanStack/query/blob/main/packages/query-core/src/removable.ts#L31)

#### Returns

`void`

#### Inherited from

```ts
Removable.clearGcTimeout
```

***

### destroy()

```ts
destroy(): void;
```

Defined in: [packages/query-core/src/query.ts:257](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L257)

#### Returns

`void`

#### Overrides

```ts
Removable.destroy
```

***

### fetch()

```ts
fetch(options?, fetchOptions?): Promise<TData>;
```

Defined in: [packages/query-core/src/query.ts:386](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L386)

#### Parameters

##### options?

[`QueryOptions`](../interfaces/QueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `never`\>

##### fetchOptions?

`FetchOptions`\<`TQueryFnData`\>

#### Returns

`Promise`\<`TData`\>

***

### getObserversCount()

```ts
getObserversCount(): number;
```

Defined in: [packages/query-core/src/query.ts:376](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L376)

#### Returns

`number`

***

### invalidate()

```ts
invalidate(): void;
```

Defined in: [packages/query-core/src/query.ts:380](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L380)

#### Returns

`void`

***

### isActive()

```ts
isActive(): boolean;
```

Defined in: [packages/query-core/src/query.ts:268](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L268)

#### Returns

`boolean`

***

### isDisabled()

```ts
isDisabled(): boolean;
```

Defined in: [packages/query-core/src/query.ts:274](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L274)

#### Returns

`boolean`

***

### isStale()

```ts
isStale(): boolean;
```

Defined in: [packages/query-core/src/query.ts:296](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L296)

#### Returns

`boolean`

***

### isStaleByTime()

```ts
isStaleByTime(staleTime): boolean;
```

Defined in: [packages/query-core/src/query.ts:308](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L308)

#### Parameters

##### staleTime

[`StaleTime`](../type-aliases/StaleTime.md) = `0`

#### Returns

`boolean`

***

### isStatic()

```ts
isStatic(): boolean;
```

Defined in: [packages/query-core/src/query.ts:285](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L285)

#### Returns

`boolean`

***

### onFocus()

```ts
onFocus(): void;
```

Defined in: [packages/query-core/src/query.ts:325](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L325)

#### Returns

`void`

***

### onOnline()

```ts
onOnline(): void;
```

Defined in: [packages/query-core/src/query.ts:334](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L334)

#### Returns

`void`

***

### optionalRemove()

```ts
protected optionalRemove(): void;
```

Defined in: [packages/query-core/src/query.ts:221](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L221)

#### Returns

`void`

#### Overrides

```ts
Removable.optionalRemove
```

***

### removeObserver()

```ts
removeObserver(observer): void;
```

Defined in: [packages/query-core/src/query.ts:354](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L354)

#### Parameters

##### observer

[`QueryObserver`](QueryObserver.md)\<`any`, `any`, `any`, `any`, `any`\>

#### Returns

`void`

***

### reset()

```ts
reset(): void;
```

Defined in: [packages/query-core/src/query.ts:263](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L263)

#### Returns

`void`

***

### scheduleGc()

```ts
protected scheduleGc(): void;
```

Defined in: [packages/query-core/src/removable.ts:13](https://github.com/TanStack/query/blob/main/packages/query-core/src/removable.ts#L13)

#### Returns

`void`

#### Inherited from

```ts
Removable.scheduleGc
```

***

### setData()

```ts
setData(newData, options?): TData;
```

Defined in: [packages/query-core/src/query.ts:227](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L227)

#### Parameters

##### newData

`TData`

##### options?

[`SetDataOptions`](../interfaces/SetDataOptions.md) & `object`

#### Returns

`TData`

***

### setOptions()

```ts
setOptions(options?): void;
```

Defined in: [packages/query-core/src/query.ts:202](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L202)

#### Parameters

##### options?

[`QueryOptions`](../interfaces/QueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `never`\>

#### Returns

`void`

***

### setState()

```ts
setState(state, setStateOptions?): void;
```

Defined in: [packages/query-core/src/query.ts:244](https://github.com/TanStack/query/blob/main/packages/query-core/src/query.ts#L244)

#### Parameters

##### state

`Partial`\<[`QueryState`](../interfaces/QueryState.md)\<`TData`, `TError`\>\>

##### setStateOptions?

`SetStateOptions`

#### Returns

`void`

***

### updateGcTime()

```ts
protected updateGcTime(newGcTime): void;
```

Defined in: [packages/query-core/src/removable.ts:23](https://github.com/TanStack/query/blob/main/packages/query-core/src/removable.ts#L23)

#### Parameters

##### newGcTime

`number` | `undefined`

#### Returns

`void`

#### Inherited from

```ts
Removable.updateGcTime
```
