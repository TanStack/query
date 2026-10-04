---
id: useIsFetching
title: useIsFetching
---

```ts
function useIsFetching(
   host: ReactiveControllerHost,
   filters: Accessor<QueryFilters<readonly unknown[]>>,
   queryClient?: QueryClient): IsFetchingAccessor;
```

Defined in: [packages/lit-query/src/useIsFetching.ts:141](https://github.com/TanStack/query/blob/main/packages/lit-query/src/useIsFetching.ts#L141)

Creates a Lit reactive controller that tracks how many matching queries are
currently fetching.

When `filters` is a function, it is re-read during host updates so the count
can follow reactive host state. If `queryClient` is omitted, the controller
resolves the client from the nearest connected `QueryClientProvider`.

## Parameters

### host

`ReactiveControllerHost`

The Lit reactive controller host that owns the cache
subscription.

### filters

[`Accessor`](../type-aliases/Accessor.md)\<[`QueryFilters`](../interfaces/QueryFilters.md)\<readonly `unknown`[]\>\> = `{}`

Query filters, or a getter that returns query filters.

<a id="filters-properties"></a>

#### `filters` properties

| Property | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| <a id="filters-exact"></a> `exact?` | `boolean` | `undefined` | Match query key exactly |
| <a id="filters-fetchstatus"></a> `fetchStatus?` | `"fetching"` \| `"paused"` \| `"idle"` | `undefined` | Include queries matching their fetchStatus |
| <a id="filters-predicate"></a> `predicate?` | (`query`: [`Query`](../classes/Query.md)) => `boolean` | `undefined` | Include queries matching this predicate function |
| <a id="filters-querykey"></a> `queryKey?` | `TQueryKey` \| `TuplePrefixes`\<`TQueryKey`\> | `undefined` | Include queries matching this query key |
| <a id="filters-stale"></a> `stale?` | `boolean` | `undefined` | Include or exclude stale queries |
| <a id="filters-type"></a> `type?` | `QueryTypeFilter` | `'all'` | Filter to active queries, inactive queries or all queries |

### queryClient?

[`QueryClient`](../classes/QueryClient.md)

Optional explicit query client. Provide this for
controllers that should not resolve a client from Lit context.

## Returns

[`IsFetchingAccessor`](../type-aliases/IsFetchingAccessor.md)

An accessor for the current number of matching fetching queries.

## Example

```ts
import { LitElement, html } from 'lit'
import { useIsFetching } from '@tanstack/lit-query'

class TodosStatus extends LitElement {
  private readonly todosFetching = useIsFetching(this, {
    queryKey: ['todos'],
  })

  render() {
    return html`<span>${this.todosFetching()} active todo fetches</span>`
  }
}
```
