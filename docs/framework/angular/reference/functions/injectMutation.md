---
id: injectMutation
title: injectMutation
---

```ts
function injectMutation<TData, TError, TVariables, TOnMutateResult>(injectMutationFn: () => CreateMutationOptions<TData, TError, TVariables, TOnMutateResult>, options?: InjectMutationOptions): CreateMutationResult<TData, TError, TVariables, TOnMutateResult>;
```

Defined in: [packages/angular-query-experimental/src/inject-mutation.ts:172](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/inject-mutation.ts#L172)

Unlike queries, mutations are typically used to create/update/delete data or perform server side-effects.
`injectMutation` is the function for that. Unlike queries, mutations are not run automatically.

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

### injectMutationFn

() => [`CreateMutationOptions`](../interfaces/CreateMutationOptions.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>

A function that returns mutation options. Similar to `computed` from Angular,
this function runs in the reactive context, so signals read inside it drive the mutation's options.

<a id="injectMutationFn-properties"></a>

#### `injectMutationFn` properties

| Property | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| <a id="injectMutationFn-property-gctime"></a> `gcTime?` | `number` | `undefined` | The time in milliseconds that an unused/inactive mutation remains in memory before it is garbage collected. Defaults to `5 * 60 * 1000` (5 minutes), or `Infinity` during SSR. |
| <a id="injectMutationFn-property-meta"></a> `meta?` | `Record`\<`string`, `unknown`\> | `undefined` | Additional payload to be stored on the mutation cache entry. Use it to pass information that can be read wherever the `mutation` is available, such as the `onError` and `onSuccess` callbacks of the `MutationCache`. |
| <a id="injectMutationFn-property-mutationfn"></a> `mutationFn?` | (`variables`: `TVariables`, `context`: [`MutationFunctionContext`](../type-aliases/MutationFunctionContext.md)) => `Promise`\<`TData`\> | `undefined` | The function that performs the asynchronous task this mutation runs. Required, unless a default mutation function has been set for the matching `mutationKey` via `queryClient.setMutationDefaults`. Receives the `variables` passed to `mutate`, and a [MutationFunctionContext](../type-aliases/MutationFunctionContext.md) holding the `QueryClient`, the `mutationKey` and `meta`. Must return a promise that resolves the mutation's data. |
| <a id="injectMutationFn-property-mutationkey"></a> `mutationKey?` | readonly `unknown`[] | `undefined` | The key to use for this mutation. Optional, but required to inherit defaults registered with `queryClient.setMutationDefaults`, and to match this mutation with `useMutationState` or `queryClient.isMutating`. |
| <a id="injectMutationFn-property-networkmode"></a> `networkMode?` | `"online"` \| `"always"` \| `"offlineFirst"` | `'online'` | Controls whether a mutation is allowed to run based on the current network connectivity. **See** [Network Mode](https://tanstack.com/query/latest/docs/framework/react/guides/network-mode) for more information. |
| <a id="injectMutationFn-property-onerror"></a> `onError?` | (`error`: `TError`, `variables`: `TVariables`, `onMutateResult`: `TOnMutateResult` \| `undefined`, `context`: [`MutationFunctionContext`](../type-aliases/MutationFunctionContext.md)) => `unknown` | `undefined` | This function fires when the mutation encounters an error, and is passed the error. If a promise is returned, it is awaited before `onSettled` runs. |
| <a id="injectMutationFn-property-onmutate"></a> `onMutate?` | (`variables`: `TVariables`, `context`: [`MutationFunctionContext`](../type-aliases/MutationFunctionContext.md)) => `TOnMutateResult` \| `Promise`\<`TOnMutateResult`\> | `undefined` | This function fires before the mutation function runs, and receives the same variables. Useful for optimistic updates applied in the hope that the mutation succeeds. The value it returns is passed to `onSuccess`, `onError` and `onSettled` as `onMutateResult`, which is where an optimistic update is usually rolled back. If a promise is returned, it is awaited before the mutation function runs. |
| <a id="injectMutationFn-property-onsettled"></a> `onSettled?` | (`data`: `TData` \| `undefined`, `error`: `TError` \| `null`, `variables`: `TVariables`, `onMutateResult`: `TOnMutateResult` \| `undefined`, `context`: [`MutationFunctionContext`](../type-aliases/MutationFunctionContext.md)) => `unknown` | `undefined` | This function fires when the mutation either succeeds or errors, and is passed either the data or the error. If a promise is returned, it is awaited before the mutation settles. |
| <a id="injectMutationFn-property-onsuccess"></a> `onSuccess?` | (`data`: `TData`, `variables`: `TVariables`, `onMutateResult`: `TOnMutateResult`, `context`: [`MutationFunctionContext`](../type-aliases/MutationFunctionContext.md)) => `unknown` | `undefined` | This function fires when the mutation succeeds, and is passed the mutation's result. If a promise is returned, it is awaited before `onSettled` runs. |
| <a id="injectMutationFn-property-retry"></a> `retry?` | \| `number` \| `false` \| `true` \| ((`failureCount`: `number`, `error`: `TError`) => `boolean`) | `0` | If `false`, failed mutations will not retry by default. If `true`, failed mutations will retry infinitely. If set to an integer number, e.g. 3, failed mutations will retry until the failed mutation count meets that number. If set to a function `(failureCount, error) => boolean` failed mutations will retry until the function returns false. |
| <a id="injectMutationFn-property-retrydelay"></a> `retryDelay?` | `number` \| ((`failureCount`: `number`, `error`: `TError`) => `number`) | `undefined` | This function receives a `retryAttempt` integer and the actual Error and returns the delay to apply before the next attempt in milliseconds. Defaults to a function that applies exponential backoff, capped at 30 seconds. |
| <a id="injectMutationFn-property-scope"></a> `scope?` | [`MutationScope`](../type-aliases/MutationScope.md) | `undefined` | Controls whether this mutation runs alongside others or waits its turn. Mutations sharing the same `scope.id` run serially, in the order they were started. Without a scope, a mutation runs as soon as it is triggered. |
| <a id="injectMutationFn-property-throwonerror"></a> `throwOnError?` | `boolean` \| ((`error`: `TError`) => `boolean`) | `false` | Whether errors should be thrown instead of setting the `error` property. If set to `true`, all errors will be thrown to the nearest error boundary. If set to a function, it will be passed the error and should return a boolean indicating whether to throw the error (`true`) or return it as state (`false`). |

### options?

[`InjectMutationOptions`](../interfaces/InjectMutationOptions.md)

Additional configuration

<a id="options-properties"></a>

#### `options` properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="options-property-injector"></a> `injector?` | `Injector` | The `Injector` in which to create the mutation. If this is not provided, the current injection context will be used instead (via `inject`). |

## Returns

[`CreateMutationResult`](../type-aliases/CreateMutationResult.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>

The mutation result. Value fields are exposed as a `Signal` — read `data`/`error` by calling them
(e.g. `mutation.data()`) — while function fields (`mutate`, `mutateAsync`, `reset`) are called directly,
unchanged. `isSuccess`/`isError`/`isPending`/`isIdle` are type-guard methods you can call to narrow whether
`data` is defined.

## Remarks

`mutate`/`mutateAsync` also accept per-call `onSuccess`/`onError`/`onSettled` callbacks as a
second argument, useful for triggering call-site side effects (e.g. navigation) without coupling them to
the shared mutation definition. Callbacks defined in `injectMutationFn` fire for every mutation; per-call
callbacks fire only for the latest call you've made — `mutateAsync` gives you a promise per call instead,
so you can await `Promise.all`/`Promise.allSettled` over several calls and see each one's outcome.

## See

[mutationOptions](mutationOptions.md) to share these options across multiple `injectMutation` call sites, or to look
the mutation up elsewhere via its `mutationKey` (e.g. with `injectMutationState`).

## Examples

```angular-ts
@Component({
  selector: 'todos',
  template: `
    @if (addMutation.isPending()) {
      <span>Adding todo...</span>
    } @else if (addMutation.isError()) {
      <div>An error occurred: {{ addMutation.error()?.message }}</div>
    }
    <button (click)="addMutation.mutate('Item')">Add</button>
  `,
})
export class Todos {
  readonly #queryClient = inject(QueryClient)

  readonly addMutation = injectMutation(() => ({
    mutationFn: addTodo,
    onSuccess: () => this.#queryClient.invalidateQueries({ queryKey: ['todos'] }),
  }))
}
```

Optimistic update via `onMutate`, rolling back on `onError`:
```angular-ts
@Component({
  selector: 'todos',
  template: `<button (click)="addMutation.mutate('Item')">Add</button>`,
})
export class Todos {
  readonly #queryClient = inject(QueryClient)

  readonly addMutation = injectMutation(() => ({
    mutationFn: addTodo,
    onMutate: async (newTodo) => {
      await this.#queryClient.cancelQueries({ queryKey: ['todos'] })
      const previousTodos = this.#queryClient.getQueryData<Array<string>>(['todos'])

      this.#queryClient.setQueryData<Array<string>>(['todos'], (old) => [
        ...(old ?? []),
        newTodo,
      ])

      // Passed to `onError` as `onMutateResult` if the mutation fails.
      return { previousTodos }
    },
    onError: (_err, _newTodo, onMutateResult) => {
      this.#queryClient.setQueryData(['todos'], onMutateResult?.previousTodos)
    },
    onSettled: () => {
      this.#queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  }))
}
```

Callbacks passed per call to `mutate` only fire for the last call — `mutateAsync` gives you a promise per
call instead, so you can wait for all of them when they succeed:
```angular-ts
@Component({
  selector: 'todos',
  template: `
    <button (click)="handleAddAll(['Todo 1', 'Todo 2', 'Todo 3'])">Add all</button>
  `,
})
export class Todos {
  readonly #queryClient = inject(QueryClient)

  readonly addMutation = injectMutation(() => ({
    mutationFn: addTodo,
    onSuccess: () => this.#queryClient.invalidateQueries({ queryKey: ['todos'] }),
  }))

  async handleAddAll(todos: Array<string>) {
    try {
      await Promise.all(todos.map((todo) => this.addMutation.mutateAsync(todo)))
    } catch (error) {
      console.error('Failed to add todos:', error)
    }
  }
}
```

If some of the mutations above can fail independently of the others, and you want to know which ones did —
rather than losing that information the moment the first one rejects — swap `Promise.all` for
`Promise.allSettled`:
```angular-ts
@Component({
  selector: 'todos',
  template: `
    <button (click)="handleAddAll(['Todo 1', 'Todo 2', 'Todo 3'])">Add all</button>
  `,
})
export class Todos {
  readonly #queryClient = inject(QueryClient)

  readonly addMutation = injectMutation(() => ({
    mutationFn: addTodo,
    onSuccess: () => this.#queryClient.invalidateQueries({ queryKey: ['todos'] }),
  }))

  async handleAddAll(todos: Array<string>) {
    const addResults = await Promise.allSettled(
      todos.map((todo) => this.addMutation.mutateAsync(todo)),
    )

    addResults.forEach((addResult, index) => {
      if (addResult.status === 'rejected') {
        console.error(`Failed to add "${todos[index]}":`, addResult.reason)
      }
    })
  }
}
```
