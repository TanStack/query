---
id: QueryResource
title: QueryResource
---

Defined in: [packages/angular-query/src/query-resource.ts:6](https://github.com/TanStack/query/blob/main/packages/angular-query/src/query-resource.ts#L6)

## Extends

- `Resource`\<`TValue`\>

## Type Parameters

### TValue

`TValue`

## Properties

### error

```ts
readonly error: Signal<Error | undefined>;
```

Defined in: node\_modules/.pnpm/@angular+core@20.3.18\_@angular+compiler@20.3.18\_rxjs@7.8.2\_zone.js@0.16.1/node\_modules/@angular/core/api.d.d.ts:139

When in the `error` state, this returns the last known error from the `Resource`.

#### Inherited from

```ts
Resource.error
```

***

### isLoading

```ts
readonly isLoading: Signal<boolean>;
```

Defined in: node\_modules/.pnpm/@angular+core@20.3.18\_@angular+compiler@20.3.18\_rxjs@7.8.2\_zone.js@0.16.1/node\_modules/@angular/core/api.d.d.ts:143

Whether this resource is loading a new value (or reloading the existing one).

#### Inherited from

```ts
Resource.isLoading
```

***

### reload()

```ts
reload: () => boolean;
```

Defined in: [packages/angular-query/src/query-resource.ts:20](https://github.com/TanStack/query/blob/main/packages/angular-query/src/query-resource.ts#L20)

Requests a new query fetch only when the current query data is stale.

Used for compatibility with Angular APIs that might want to reload a resource,
like Signal Forms' validateAsync resource interface.

#### Returns

`boolean`

`true` if a reload was initiated, `false` if a reload was unnecessary or unsupported.

***

### snapshot

```ts
readonly snapshot: Signal<ResourceSnapshot<TValue>>;
```

Defined in: [packages/angular-query/src/query-resource.ts:10](https://github.com/TanStack/query/blob/main/packages/angular-query/src/query-resource.ts#L10)

The current query state as a single snapshot.

***

### status

```ts
readonly status: Signal<ResourceStatus>;
```

Defined in: node\_modules/.pnpm/@angular+core@20.3.18\_@angular+compiler@20.3.18\_rxjs@7.8.2\_zone.js@0.16.1/node\_modules/@angular/core/api.d.d.ts:135

The current status of the `Resource`, which describes what the resource is currently doing and
what can be expected of its `value`.

#### Inherited from

```ts
Resource.status
```

***

### value

```ts
readonly value: Signal<TValue>;
```

Defined in: node\_modules/.pnpm/@angular+core@20.3.18\_@angular+compiler@20.3.18\_rxjs@7.8.2\_zone.js@0.16.1/node\_modules/@angular/core/api.d.d.ts:130

The current value of the `Resource`, or throws an error if the resource is in an error state.

#### Inherited from

```ts
Resource.value
```

## Methods

### hasValue()

#### Call Signature

```ts
hasValue(this): this is Resource<Exclude<TValue, undefined>>;
```

Defined in: node\_modules/.pnpm/@angular+core@20.3.18\_@angular+compiler@20.3.18\_rxjs@7.8.2\_zone.js@0.16.1/node\_modules/@angular/core/api.d.d.ts:149

Whether this resource has a valid current value.

This function is reactive.

##### Parameters

###### this

`TValue` *extends* `undefined` ? `QueryResource`\<`TValue`\> : `never`

##### Returns

`this is Resource<Exclude<TValue, undefined>>`

##### Inherited from

```ts
Resource.hasValue
```

#### Call Signature

```ts
hasValue(): boolean;
```

Defined in: node\_modules/.pnpm/@angular+core@20.3.18\_@angular+compiler@20.3.18\_rxjs@7.8.2\_zone.js@0.16.1/node\_modules/@angular/core/api.d.d.ts:150

##### Returns

`boolean`

##### Inherited from

```ts
Resource.hasValue
```
