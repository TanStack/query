---
id: injectIsMutating
title: injectIsMutating
---

```ts
function injectIsMutating(filters?, options?): Signal<number>;
```

Defined in: [inject-is-mutating.ts:46](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/inject-is-mutating.ts#L46)

Injects a signal that tracks the number of mutations that your application currently has `pending`
(useful for app-wide loading indicators).

## Parameters

### filters?

`MutationFilters`\<`unknown`, `Error`, `unknown`, `unknown`\>

The MutationFilters to narrow down the matched mutations.

### options?

[`InjectIsMutatingOptions`](../interfaces/InjectIsMutatingOptions.md)

Additional configuration

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
  isMutatingPosts = injectIsMutating({ mutationKey: ['posts'] })
}
```
