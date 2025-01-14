---
id: mutationOptions
title: mutationOptions
---

# Function: mutationOptions()

```ts
function mutationOptions<TData, TError, TVariables, TContext>(
  options,
): CreateMutationOptions<TData, TError, TVariables, TContext>
```

Allows to share and re-use mutation options in a type-safe way.

**Example**

```ts
export class QueriesService {
  private http = inject(HttpClient)

  updatePost(id: number) {
    return mutationOptions({
      mutationFn: (post: Post) => Promise.resolve(post),
      mutationKey: ['updatePost', id],
      onSuccess: (newPost) => {
        //           ^? newPost: Post
        this.queryClient.setQueryData(['posts', id], newPost)
      },
    })
  }
}

queries = inject(QueriesService)
idSignal = new Signal(0)
mutation = injectMutation(() => this.queries.updatePost(this.idSignal()))

mutation.mutate({ title: 'New Title' })
```

## Type Parameters

• **TData** = `unknown`

• **TError** = `Error`

• **TVariables** = `void`

• **TContext** = `unknown`

## Parameters

### options

`MutationObserverOptions`\<`TData`, `TError`, `TVariables`, `TContext`\>

The mutation options.

## Returns

[`CreateMutationOptions`](../interfaces/createmutationoptions.md)\<`TData`, `TError`, `TVariables`, `TContext`\>

Mutation options.

## Defined in

[mutation-options.ts:38](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/mutation-options.ts#L38)
