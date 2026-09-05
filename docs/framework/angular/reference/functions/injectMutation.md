---
id: injectMutation
title: injectMutation
---

```ts
function injectMutation<TData, TError, TVariables, TOnMutateResult>(injectMutationFn, options?): CreateMutationResult<TData, TError, TVariables, TOnMutateResult>;
```

Defined in: [inject-mutation.ts:174](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/inject-mutation.ts#L174)

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

### options?

[`InjectMutationOptions`](../interfaces/InjectMutationOptions.md)

Additional configuration

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
  #queryClient = inject(QueryClient)

  addMutation = injectMutation(() => ({
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
  #queryClient = inject(QueryClient)

  addMutation = injectMutation(() => ({
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
call instead, so you can wait for all of them:
```angular-ts
@Component({
  selector: 'todos',
  template: `
    <button (click)="handleAddAll(['Todo 1', 'Todo 2', 'Todo 3'])">Add all</button>
  `,
})
export class Todos {
  #queryClient = inject(QueryClient)

  addMutation = injectMutation(() => ({
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
  #queryClient = inject(QueryClient)

  addMutation = injectMutation(() => ({
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
