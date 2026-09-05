---
id: mutationOptions
title: mutationOptions
---

## Call Signature

```ts
function mutationOptions<TData, TError, TVariables, TOnMutateResult>(options): WithRequired<CreateMutationOptions<TData, TError, TVariables, TOnMutateResult>, "mutationKey">;
```

Defined in: [mutation-options.ts:40](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/mutation-options.ts#L40)

You can generally pass everything to `mutationOptions` that you can also pass to `injectMutation`. A
`mutationKey` is required on this overload so the mutation can be looked up later, e.g. with
`injectMutationState`.

### Type Parameters

#### TData

`TData` = `unknown`

#### TError

`TError` = `Error`

#### TVariables

`TVariables` = `void`

#### TOnMutateResult

`TOnMutateResult` = `unknown`

### Parameters

#### options

`WithRequired`\<[`CreateMutationOptions`](../interfaces/CreateMutationOptions.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>, `"mutationKey"`\>

The mutation options to use, identical to what you'd pass to `injectMutation`, with a
required `mutationKey`.

### Returns

`WithRequired`\<[`CreateMutationOptions`](../interfaces/CreateMutationOptions.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>, `"mutationKey"`\>

The same options object, unchanged.

### See

[injectMutation](injectMutation.md) to run the mutation these options describe.

### Example

Looking the mutation up elsewhere via its `mutationKey`, e.g. for a global "saving…" indicator:
```angular-ts
import { mutationOptions, injectMutationState } from '@tanstack/angular-query-experimental'

const createPostOptions = mutationOptions({
  mutationKey: ['posts', 'create'],
  mutationFn: createPost,
})

@Component({
  selector: 'saving-indicator',
  template: `
    @if (isCreatingPost()) {
      <span>Saving…</span>
    }
  `,
})
export class SavingIndicator {
  #pendingCreates = injectMutationState(() => ({
    filters: { mutationKey: createPostOptions.mutationKey, status: 'pending' },
  }))
  isCreatingPost = computed(() => this.#pendingCreates().length > 0)
}
```

## Call Signature

```ts
function mutationOptions<TData, TError, TVariables, TOnMutateResult>(options): Omit<CreateMutationOptions<TData, TError, TVariables, TOnMutateResult>, "mutationKey">;
```

Defined in: [mutation-options.ts:98](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/mutation-options.ts#L98)

You can generally pass everything to `mutationOptions` that you can also pass to `injectMutation`. No
`mutationKey` is required on this overload — use this when you don't need to target the mutation via a
`mutationKey` filter later (e.g. with `injectMutationState`); it can still be observed through other
filters, such as `status`.

### Type Parameters

#### TData

`TData` = `unknown`

#### TError

`TError` = `Error`

#### TVariables

`TVariables` = `void`

#### TOnMutateResult

`TOnMutateResult` = `unknown`

### Parameters

#### options

`Omit`\<[`CreateMutationOptions`](../interfaces/CreateMutationOptions.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>, `"mutationKey"`\>

The mutation options to use, identical to what you'd pass to `injectMutation`, without a
`mutationKey`.

### Returns

`Omit`\<[`CreateMutationOptions`](../interfaces/CreateMutationOptions.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>, `"mutationKey"`\>

The same options object, unchanged.

### See

[injectMutation](injectMutation.md) to run the mutation these options describe.

### Remarks

See the other overload's example for looking a mutation up via `injectMutationState`.

### Example

Sharing options across services, so `QueriesService` stays the single place a mutation is defined:
```angular-ts
import { mutationOptions, injectMutation } from '@tanstack/angular-query-experimental'

@Injectable({ providedIn: 'root' })
export class QueriesService {
  #queryClient = inject(QueryClient)

  updatePost(id: number) {
    return mutationOptions({
      mutationFn: (post: Partial<Post>) => putPost(id, post),
      onSuccess: (newPost) => this.#queryClient.setQueryData(['posts', id], newPost),
    })
  }
}

@Component({
  selector: 'post',
  template: `<button (click)="save()">Save</button>`,
})
export class Post {
  queries = inject(QueriesService)
  id = signal(0)
  updatePostMutation = injectMutation(() => this.queries.updatePost(this.id()))

  save() {
    this.updatePostMutation.mutate({ title: 'New Title' })
  }
}
```
