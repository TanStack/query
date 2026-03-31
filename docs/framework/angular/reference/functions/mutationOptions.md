---
id: mutationOptions
title: mutationOptions
---

# Function: mutationOptions()

Allows to share and re-use mutation options in a type-safe way.

**Example**

```ts
export class QueriesService {
  private http = inject(HttpClient)
  private queryClient = inject(QueryClient)

  updatePost(id: number) {
    return mutationOptions({
      mutationFn: (post: Post) => Promise.resolve(post),
      mutationKey: ["updatePost", id],
      onSuccess: (newPost) => {
        //           ^? newPost: Post
        this.queryClient.setQueryData(["posts", id], newPost)
      },
    });
  }
}

class ComponentOrService {
  queries = inject(QueriesService)
  id = signal(0)
  mutation = injectMutation(() => this.queries.updatePost(this.id()))

  save() {
    this.mutation.mutate({ title: 'New Title' })
  }
}
```

## Param

The mutation options.

## Call Signature

```ts
function mutationOptions<TData, TError, TVariables, TOnMutateResult>(options): WithRequired<CreateMutationOptions<TData, TError, TVariables, TOnMutateResult>, "mutationKey">;
```

Defined in: [mutation-options.ts:4](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/mutation-options.ts#L4)

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

### Returns

`WithRequired`\<[`CreateMutationOptions`](../interfaces/CreateMutationOptions.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>, `"mutationKey"`\>

## Call Signature

```ts
function mutationOptions<TData, TError, TVariables, TOnMutateResult>(options): Omit<CreateMutationOptions<TData, TError, TVariables, TOnMutateResult>, "mutationKey">;
```

Defined in: [mutation-options.ts:18](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/mutation-options.ts#L18)

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

### Returns

`Omit`\<[`CreateMutationOptions`](../interfaces/CreateMutationOptions.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>, `"mutationKey"`\>
