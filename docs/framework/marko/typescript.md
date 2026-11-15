---
id: typescript
title: TypeScript
---

Marko Query is written in TypeScript and reuses TanStack Query Core's type system. Give your query and mutation functions well-defined return types, and the tag variables infer from them.

To check the types of your templates, use [`@marko/type-check`](https://github.com/marko-js/language-server/tree/main/packages/type-check) (`mtc`).

## Query Inference

```ts
// src/lib/api.ts
// This module runs on the server and in the browser, so the origin must be
// reachable from both. Set VITE_API_URL to the app's API origin.
const API_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export type Todo = {
  id: number
  title: string
}

export type CreateTodoInput = {
  title: string
}

export async function fetchTodos(): Promise<Todo[]> {
  const response = await fetch(`${API_URL}/api/todos`)
  if (!response.ok) throw new Error('Failed to fetch todos')
  return response.json() as Promise<Todo[]>
}

export async function addTodo(input: CreateTodoInput): Promise<Todo> {
  const response = await fetch(`${API_URL}/api/todos`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
  if (!response.ok) throw new Error('Failed to create todo')
  return response.json() as Promise<Todo>
}
```

```marko
import { fetchTodos } from "../lib/api";

<query/todos options=() => ({ queryKey: ["todos"], queryFn: fetchTodos })/>
// todos.data is Todo[] | undefined

<if=todos.isSuccess>
  // todos.data is Todo[]
  <p>${todos.data.length} todos</p>
</if>
```

Checking `isSuccess`, `isPending`, `isError`, or `status` narrows the result in the same way as the TanStack Query Core result types.

## Mutation Inference

The variables of `mutate` are inferred from `mutationFn`:

```marko
import { addTodo } from "../lib/api";

<mutation/createTodo options=() => ({ mutationFn: addTodo })/>

<button onClick() { createTodo.mutate({ title: "Learn Marko Query" }) }>
  Add Todo
</button>
```

Here, `createTodo.mutate` accepts only a `CreateTodoInput`, and `createTodo.data` is `Todo | undefined`.

## Extracting Options

Use `queryOptions`, `infiniteQueryOptions`, and `mutationOptions` when you want to share typed options between tags and `QueryClient` calls:

```ts
// src/lib/queries.ts
import { queryOptions } from '@tanstack/marko-query'

export const todosQuery = queryOptions({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  staleTime: 5 * 1000,
})
```

```ts
// src/routes/todos/+handler.ts
import { getQueryClient, noop } from '@tanstack/marko-query'
import { todosQuery } from '../../lib/queries'

export const GET = Run.GET(async (context, next) => {
  await getQueryClient(context).query(todosQuery).catch(noop)
  return next()
})
```

```marko
// src/routes/todos/+page.marko
import { todosQuery } from "../../lib/queries";

<query/todos options=() => todosQuery/>
```

The branded `queryKey` returned from `queryOptions` also helps APIs like `getQueryData` understand the data type.

## Global Register Types

Because `@tanstack/marko-query` re-exports TanStack Query Core, module augmentation is written against `@tanstack/marko-query` in Marko apps:

```ts
import '@tanstack/marko-query'

type AppQueryKey = ['todos' | 'projects', ...ReadonlyArray<unknown>]

declare module '@tanstack/marko-query' {
  interface Register {
    queryKey: AppQueryKey
    mutationKey: AppQueryKey
  }
}
```
