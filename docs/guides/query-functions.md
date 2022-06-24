---
id: query-functions
title: Query Functions
---

A query function can be literally any function that **returns a promise**. The promise that is returned should either **resolve the data** or **throw an error**.

All of the following are valid query function configurations:

```js
useQuery(['todos'], fetchAllTodos)
useQuery(['todos', todoId], () => fetchTodoById(todoId))
useQuery(['todos', todoId], async () => {
  const data = await fetchTodoById(todoId)
  return data
})
useQuery(['todos', todoId], ({ queryKey }) => fetchTodoById(queryKey[1]))
```

## Handling and Throwing Errors

For React Query to determine a query has errored, the query function **must throw**. Any error that is thrown in the query function will be persisted on the `error` state of the query.

```js
const { error } = useQuery(['todos', todoId], async () => {
  if (somethingGoesWrong) {
    throw new Error('Oh no!')
  }

  return data
})
```

## Usage with `fetch` and other clients that do not throw by default

While most utilities like `axios` or `graphql-request` automatically throw errors for unsuccessful HTTP calls, some utilities like `fetch` do not throw errors by default. If that's the case, you'll need to throw them on your own. Here is a simple way to do that with the popular `fetch` API:

```js
useQuery(['todos', todoId], async () => {
  const response = await fetch('/todos/' + todoId)
  if (!response.ok) {
    throw new Error('Network response was not ok')
  }
  return response.json()
})
```

## Query Function Variables

Query keys are not just for uniquely identifying the data you are fetching, but are also conveniently passed into your query function as part of the QueryFunctionContext. While not always necessary, this makes it possible to extract your query functions if needed:

```js
function Todos({ status, page }) {
  const result = useQuery(['todos', { status, page }], fetchTodoList)
}

// Access the key, status and page variables in your query function!
function fetchTodoList({ queryKey }) {
  const [_key, { status, page }] = queryKey
  return new Promise()
}
```

### QueryFunctionContext

The `QueryFunctionContext` is the object passed to each query function. It consists of:

- `queryKey: QueryKey`: [Query Keys](./query-keys)
- `pageParam: unknown | undefined`
  - only for [Infinite Queries](./infinite-queries.md)
  - the page parameter used to fetch the current page
- signal?: AbortSignal
  - [AbortSignal](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) instance provided by react-query
  - Can be used for [Query Cancellation](./query-cancellation.md)
- `meta?: Record<string, unknown>`
  - an optional field you can fill with additional information about your query

## Using a Query Object instead of parameters

Anywhere the `[queryKey, queryFn, config]` signature is supported throughout React Query's API, you can also use an object to express the same configuration:

```js
import { useQuery } from '@tanstack/react-query'

useQuery({
  queryKey: ['todo', 7],
  queryFn: fetchTodo,
  ...config,
})
```
