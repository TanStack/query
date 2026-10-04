---
id: injectIsMutating
title: injectIsMutating
---

```ts
function injectIsMutating(filters?: MutationFilters<unknown, Error, unknown, unknown>, options?: InjectIsMutatingOptions): Signal<number>;
```

Defined in: [packages/angular-query-experimental/src/inject-is-mutating.ts:47](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/inject-is-mutating.ts#L47)

Injects a signal that tracks the number of mutations that your application currently has `pending`
(useful for app-wide loading indicators).

## Parameters

### filters?

[`MutationFilters`](../interfaces/MutationFilters.md)\<`unknown`, `Error`, `unknown`, `unknown`\>

The [MutationFilters](../interfaces/MutationFilters.md) to narrow down the matched mutations.

<a id="filters-properties"></a>

#### `filters` properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="filters-exact"></a> `exact?` | `boolean` | Match mutation key exactly |
| <a id="filters-mutationkey"></a> `mutationKey?` | readonly `unknown`[] | Include mutations matching this mutation key |
| <a id="filters-predicate"></a> `predicate?` | (`mutation`: [`Mutation`](../classes/Mutation.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>) => `boolean` | Include mutations matching this predicate function |
| <a id="filters-status"></a> `status?` | `"error"` \| `"pending"` \| `"success"` \| `"idle"` | Filter by mutation status |

### options?

[`InjectIsMutatingOptions`](../interfaces/InjectIsMutatingOptions.md)

Additional configuration

<a id="options-properties"></a>

#### `options` properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="options-injector"></a> `injector?` | `Injector` | The `Injector` in which to create the isMutating signal. If this is not provided, the current injection context will be used instead (via `inject`). |

## Returns

`Signal`\<`number`\>

A `Signal` with the number of mutations that your application currently has `pending`.

## Example

```angular-ts
@Component({
  selector: 'posts-mutating-indicator',
  template: `
    @if (isMutatingPosts()) {
      <span>Saving posts...</span>
    }
  `,
})
export class PostsMutatingIndicator {
  // How many mutations matching the posts prefix are in progress?
  readonly isMutatingPosts = injectIsMutating({ mutationKey: ['posts'] })
}
```
