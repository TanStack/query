---
id: mutations
title: Mutations
---

Unlike queries, mutations are used to create, update, delete, or otherwise perform server side effects. In Marko, use the `<mutation>` tag:

```marko
import { getQueryClient } from "@tanstack/marko-query";

<query/todos options=() => ({ queryKey: ["todos"], queryFn: fetchTodos })/>
<mutation/addTodo options=() => ({
  mutationFn: createTodo,
  onSuccess: () =>
    getQueryClient($global).invalidateQueries({ queryKey: ["todos"] }),
})/>

<if=addTodo.isError>
  <p>${addTodo.error.message}</p>
</if>
<if=addTodo.isSuccess>
  <p>Todo added</p>
</if>

<button
  disabled=addTodo.isPending
  onClick() {
    addTodo.mutate({ title: "Write mutation docs" });
  }
>
  ${addTodo.isPending ? "Adding..." : "Add Todo"}
</button>

<ul>
  <for|todo| of=(todos.data ?? []) by="id">
    <li>${todo.title}</li>
  </for>
</ul>
```

A mutation runs only when you call `mutate` or `mutateAsync`, so it runs in the browser. On the server, the result of `<mutation>` is always idle.

## Mutation States

A mutation can be in one of these primary states:

- `isIdle` or `status === 'idle'`: no mutation has run or it has been reset
- `isPending` or `status === 'pending'`: the mutation is running
- `isError` or `status === 'error'`: the mutation failed and `error` is available
- `isSuccess` or `status === 'success'`: the mutation finished and `data` is available

## Variables

Pass variables to the mutation function by calling `mutate`:

```marko
<button onClick() { addTodo.mutate({ title }) }>Add Todo</button>
```

`mutate` returns nothing. If the mutation fails, the error is in the result: `mutate` does not throw, and it does not return a rejected promise.

Use `mutateAsync` when you want a promise. It rejects when the mutation fails:

```marko
<button onClick() {
  addTodo
    .mutateAsync({ title })
    .then((created) => console.log(created.title))
    .catch((error) => console.error(error));
}>
  Add Todo
</button>
```

`mutate` and `mutateAsync` also accept callbacks for one call, as a second argument:

```marko
<button onClick() {
  addTodo.mutate({ title }, { onSettled: () => console.log("settled") });
}>
  Add Todo
</button>
```

## Resetting Mutation State

The result includes `reset`:

```marko
<if=addTodo.isError>
  <button onClick() { addTodo.reset() }>Clear error</button>
</if>
```

## Side Effects

Mutation options support `onMutate`, `onError`, `onSuccess`, and `onSettled`. To read or write the cache in these callbacks, get the client with `getQueryClient($global)`. This example updates the cache optimistically and rolls back on error:

```marko
import { getQueryClient } from "@tanstack/marko-query";

<mutation/toggleTodo options=() => ({
  mutationFn: updateTodo,
  onMutate: async (todo: Todo) => {
    const client = getQueryClient($global);
    await client.cancelQueries({ queryKey: ["todos"] });
    const previous = client.getQueryData<Todo[]>(["todos"]);
    client.setQueryData<Todo[]>(["todos"], (old) =>
      old?.map((item) =>
        item.id === todo.id ? { ...item, completed: !item.completed } : item,
      ),
    );
    return { previous };
  },
  onError: (_error, _todo, onMutateResult) => {
    getQueryClient($global).setQueryData(["todos"], onMutateResult?.previous);
  },
  onSettled: () =>
    getQueryClient($global).invalidateQueries({ queryKey: ["todos"] }),
})/>
```

## Errors

By default, errors are in the result. To handle them with a `<try>` tag instead, set `throwOnError: true`. When the mutation fails, the tag throws the error during render, and the nearest `<@catch>` renders it.

## Mutation State in Other Tags

To read mutations from anywhere in the page, use these tags:

- `<is-mutating>` returns the number of pending mutations. Its optional `filters` function selects which mutations to count.
- `<mutation-state>` returns one value for each mutation in the cache. Its optional `options` function returns `filters` and `select`.

```marko
<is-mutating/savingTodos filters=() => ({ mutationKey: ["todos"] })/>
<mutation-state/pendingTitles options=() => ({
  filters: { mutationKey: ["todos"], status: "pending" },
  select: (mutation) => (mutation.state.variables as { title: string }).title,
})/>

<if=savingTodos>
  <p>Saving: ${pendingTitles.join(", ")}</p>
</if>
```

To match mutations by `mutationKey`, give the mutations a `mutationKey`, for example with `mutationOptions`.
