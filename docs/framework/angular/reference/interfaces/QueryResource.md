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

| Property | Modifier | Type | Description | Overrides |
| ------ | ------ | ------ | ------ | ------ |
| <a id="error"></a> `error` | `readonly` | `Signal`\<`Error` \| `undefined`\> | When in the `error` state, this returns the last known error from the `Resource`. | - |
| <a id="isloading"></a> `isLoading` | `readonly` | `Signal`\<`boolean`\> | Whether this resource is loading a new value (or reloading the existing one). | - |
| <a id="reload"></a> `reload` | `public` | () => `boolean` | Requests a new query fetch only when the current query data is stale. Used for compatibility with Angular APIs that might want to reload a resource, like Signal Forms' validateAsync resource interface. | - |
| <a id="snapshot"></a> `snapshot` | `readonly` | `Signal`\<`ResourceSnapshot`\<`TValue`\>\> | The current query state as a single snapshot. | `Resource.snapshot` |
| <a id="status"></a> `status` | `readonly` | `Signal`\<`ResourceStatus`\> | The current status of the `Resource`, which describes what the resource is currently doing and what can be expected of its `value`. | - |
| <a id="value"></a> `value` | `readonly` | `Signal`\<`TValue`\> | The current value of the `Resource`, or throws an error if the resource is in an error state. | - |

## Methods

### hasValue()

#### Call Signature

```ts
hasValue(this: TValue extends undefined ? QueryResource<TValue> : never): this is Resource<Exclude<TValue, undefined>>;
```

Defined in: node\_modules/.pnpm/@angular+core@22.1.6\_@angular+compiler@22.1.6\_rxjs@7.8.2\_zone.js@0.16.1/node\_modules/@angular/core/types/\_api-chunk.d.ts:186

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

Defined in: node\_modules/.pnpm/@angular+core@22.1.6\_@angular+compiler@22.1.6\_rxjs@7.8.2\_zone.js@0.16.1/node\_modules/@angular/core/types/\_api-chunk.d.ts:187

##### Returns

`boolean`

##### Inherited from

```ts
Resource.hasValue
```
