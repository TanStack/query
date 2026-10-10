---
id: injectIsFetching
title: injectIsFetching
---

```ts
function injectIsFetching(filters?: QueryFilters<readonly unknown[]>, options?: InjectIsFetchingOptions): Signal<number>;
```

Defined in: [packages/angular-query-experimental/src/inject-is-fetching.ts:63](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/inject-is-fetching.ts#L63)

Injects a signal that tracks the number of queries that your application is loading or fetching in the
background (useful for app-wide loading indicators).

## Parameters

### filters?

[`QueryFilters`](../interfaces/QueryFilters.md)\<readonly `unknown`[]\>

The [QueryFilters](../interfaces/QueryFilters.md) to narrow down the matched queries.

<a id="filters-properties"></a>

#### `filters` properties

| Property | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| <a id="filters-property-exact"></a> `exact?` | `boolean` | `undefined` | Match query key exactly |
| <a id="filters-property-fetchstatus"></a> `fetchStatus?` | `"fetching"` \| `"paused"` \| `"idle"` | `undefined` | Include queries matching their fetchStatus |
| <a id="filters-property-predicate"></a> `predicate?` | (`query`: [`Query`](../classes/Query.md)) => `boolean` | `undefined` | Include queries matching this predicate function |
| <a id="filters-property-querykey"></a> `queryKey?` | `TQueryKey` \| `TuplePrefixes`\<`TQueryKey`\> | `undefined` | Include queries matching this query key |
| <a id="filters-property-stale"></a> `stale?` | `boolean` | `undefined` | Include or exclude stale queries |
| <a id="filters-property-type"></a> `type?` | `QueryTypeFilter` | `'all'` | Filter to active queries, inactive queries or all queries |

### options?

[`InjectIsFetchingOptions`](../interfaces/InjectIsFetchingOptions.md)

Additional configuration

<a id="options-properties"></a>

#### `options` properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="options-property-injector"></a> `injector?` | `Injector` | The `Injector` in which to create the isFetching signal. If this is not provided, the current injection context will be used instead (via `inject`). |

## Returns

`Signal`\<`number`\>

A `Signal` with the number of queries that your application is currently loading or fetching in
the background.

## Examples

```angular-ts
@Component({
  selector: 'posts-fetching-indicator',
  template: `
    @if (isFetchingPosts()) {
      <span>Refreshing posts...</span>
    }
  `,
})
export class PostsFetchingIndicator {
  // How many queries matching the posts prefix are fetching?
  readonly isFetchingPosts = injectIsFetching({ queryKey: ['posts'] })
}
```

A global loading indicator for any query fetching in the background, not just the ones on screen:
```angular-ts
@Component({
  selector: 'global-loading-indicator',
  template: `
    @if (isFetching()) {
      <div>Queries are fetching in the background...</div>
    }
  `,
})
export class GlobalLoadingIndicator {
  readonly isFetching = injectIsFetching()
}
```
