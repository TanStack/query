---
id: injectIsMutating
title: injectIsMutating
---

```ts
function injectIsMutating(filters): Signal<number>;
```

Defined in: [packages/angular-query/src/inject-is-mutating.ts:14](https://github.com/TanStack/query/blob/main/packages/angular-query/src/inject-is-mutating.ts#L14)

Injects a signal that tracks the number of mutations that your application currently has `pending`
(useful for app-wide loading indicators).

## Parameters

### filters

() => `MutationFilters`

A reactive factory for the filters.

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
