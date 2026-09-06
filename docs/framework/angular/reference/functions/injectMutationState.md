---
id: injectMutationState
title: injectMutationState
---

```ts
function injectMutationState<TResult>(injectMutationStateFn, options?): Signal<TResult[]>;
```

Defined in: [inject-mutation-state.ts:106](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/inject-mutation-state.ts#L106)

Injects a signal that gives you access to all mutations in the `MutationCache`. You can pass `filters`
(MutationFilters) to narrow down your mutations, and `select` to transform the mutation state.

## Type Parameters

### TResult

`TResult` = `MutationState`\<`unknown`, `Error`, `unknown`, `unknown`\>

## Parameters

### injectMutationStateFn

() => `MutationStateOptions`\<`TResult`\>

A function returning the `filters` to narrow down matched mutations, and an
optional `select` to transform the mutation state. Similar to `computed` from Angular, this function runs
in the reactive context, so signals read inside it re-narrow the matched mutations.

### options?

[`InjectMutationStateOptions`](../interfaces/InjectMutationStateOptions.md)

Additional configuration

## Returns

`Signal`\<`TResult`[]\>

A `Signal` with an Array of whatever `select` returns for each matching mutation.

## Examples

Get all variables of all running mutations:
```angular-ts
@Component({
  selector: 'pending-posts',
  template: `{{ pendingVariables().length }} posts saving...`,
})
export class PendingPosts {
  readonly pendingVariables = injectMutationState(() => ({
    filters: { status: 'pending' },
    select: (mutation) => mutation.state.variables,
  }))
}
```

Get all data for specific mutations via the `mutationKey`:
```angular-ts
const mutationKey = ['posts']

@Component({
  selector: 'posts',
  template: `
    <button (click)="createPost()">
      Create post ({{ savedPosts().length }} saved so far)
    </button>
  `,
})
export class Posts {
  // Some mutation that we want to get the state for
  readonly createPostMutation = injectMutation(() => ({
    mutationKey,
    mutationFn: createPosts,
  }))

  readonly savedPosts = injectMutationState(() => ({
    // this mutation key needs to match the mutation key of the given mutation (see above)
    filters: { mutationKey, status: 'success' },
    select: (mutation) => mutation.state.data,
  }))

  createPost() {
    this.createPostMutation.mutate(['New Post'])
  }
}
```
