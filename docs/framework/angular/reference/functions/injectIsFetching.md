---
id: injectIsFetching
title: injectIsFetching
---

```ts
function injectIsFetching(filters?, options?): Signal<number>;
```

Defined in: [inject-is-fetching.ts:63](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/inject-is-fetching.ts#L63)

Injects a signal that tracks the number of queries that your application is loading or fetching in the
background (useful for app-wide loading indicators).

## Parameters

### filters?

`QueryFilters`\<readonly `unknown`[]\>

The QueryFilters to narrow down the matched queries.

### options?

[`InjectIsFetchingOptions`](../interfaces/InjectIsFetchingOptions.md)

Additional configuration

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
