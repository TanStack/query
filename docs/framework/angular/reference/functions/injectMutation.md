---
id: injectMutation
title: injectMutation
---

```ts
function injectMutation<TData, TError, TVariables, TOnMutateResult>(optionsFn: () => CreateMutationOptions<TData, TError, TVariables, TOnMutateResult>): CreateMutationResult<TData, TError, TVariables, TOnMutateResult>;
```

Defined in: [packages/angular-query/src/inject-mutation.ts:51](https://github.com/TanStack/query/blob/main/packages/angular-query/src/inject-mutation.ts#L51)

Injects a mutation: an imperative function that can be invoked which typically performs server side effects.
Unlike queries, mutations are not run automatically.

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = `Error`

### TVariables

`TVariables` = `void`

### TOnMutateResult

`TOnMutateResult` = `unknown`

## Parameters

### optionsFn

() => [`CreateMutationOptions`](../interfaces/CreateMutationOptions.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>

A function that returns mutation options. Similar to `computed` from Angular, this
function runs in the reactive context, so signals read inside it drive the mutation.

## Returns

[`CreateMutationResult`](../type-aliases/CreateMutationResult.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>

The mutation result, including `mutate` and `mutateAsync`.

## See

 - https://tanstack.com/query/latest/docs/framework/angular/guides/mutations
 - [mutationOptions](mutationOptions.md) to share these options between `injectMutation` and `injectMutationState`.

## Example

```angular-ts
@Component({
  template: `
    @if (mutation.isPending()) {
      Saving...
    } @else if (mutation.isError()) {
      <span>Error: {{ mutation.error()?.message }}</span>
    }
    <button (click)="mutation.mutate({ title: 'New post' })">Create</button>
  `,
})
export class CreatePost {
  readonly mutation = injectMutation(() => ({
    mutationFn: createPost,
  }))
}
```
