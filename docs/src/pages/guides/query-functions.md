---
id: query-functions
title: Query Functions
---

A query function can be literally any function that **returns a promise**. The promise that is returned should either **resolve the data** or **throw an error**.

All of the following are valid query function configurations:

```js
useQuery(['todos', todoId], fetchTodoById)
useQuery(['todos', todoId], () => fetchTodoById(todoId))
useQuery(['todos', todoId], async () => {
  const data = await fetchTodoById(todoId)
  return data
})
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

## Usage with `fetch` and others clients that do not throw by default

While most utilities like `axios` or `graphql-request` automatically throw errors for unsuccessful HTTP calls, some utilities like `fetch` do not throw errors by default. If that's the case, you'll need to throw them on your own. Here is a simple way to do that with the popular `fetch` API:

```js
useQuery(['todos', todoId], async () => {
  const { ok, json } = await fetch('/todos/' + todoId)
  if (!ok) {
    throw new Error('Network response was not ok')
  }
  return json()
})
```

## Query Function Variables

Query keys are not just for uniquely identifying the data you are fetching, but are also conveniently passed as variables for your query function and while not always necessary, this makes it possible to extract your query functions if needed. The individual parts of the query key get passed through to your query function as parameters in the same order they appear in the array key:

```js
function Todos({ completed }) {
  const result = useQuery(['todos', { status, page }], fetchTodoList)
}

// Access the key, status and page variables in your query function!
function fetchTodoList(key, { status, page }) {
  return new Promise()
  // ...
}
```

If you send through more items in your query key, they will also be available in your query function:

```js
function Todo({ todoId, preview }) {
  const result = useQuery(['todo', todoId, { preview }], fetchTodoById)
}

// Access status and page in your query function!
function fetchTodoById(key, todoId, { preview }) {
  return new Promise()
  // ...
}
```

## Using a Query Object instead of parameters

Anywhere the `[queryKey, queryFn, config]` signature is supported throughout React Query's API, you can also use an object to express the same configuration:

```js
import { useQuery } from 'react-query'

useQuery({
  queryKey: ['todo', 7],
  queryFn: fetchTodo,
  ...config,
})
```
