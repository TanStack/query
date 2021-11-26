---
id: query-keys
title: Query Keys
---

At its core, React Query manages query caching for you based on query keys. Query keys have to be an Array at the top level, and can be as simple as an Array with a single string, or as complex as an array of many strings and nested objects. As long as the query key is serializable, and **unique to the query's data**, you can use it!

## Simple Query Keys

The simplest form of a key is an array with constants values. This format is useful for:

- Generic List/Index resources
- Non-hierarchical resources

```js
// A list of todos
useQuery(['todos'], ...)

// Something else, whatever!
useQuery(['something', 'special'], ...)
```

## Array Keys with variables

When a query needs more information to uniquely describe its data, you can use an array with a string and any number of serializable objects to describe it. This is useful for:

- Hierarchical or nested resources
  - It's common to pass an ID, index, or other primitive to uniquely identify the item
- Queries with additional parameters
  - It's common to pass an object of additional options

```js
// An individual todo
useQuery(['todo', 5], ...)

// An individual todo in a "preview" format
useQuery(['todo', 5, { preview: true }], ...)

// A list of todos that are "done"
useQuery(['todos', { type: 'done' }], ...)
```

## Query Keys are hashed deterministically!

This means that no matter the order of keys in objects, all of the following queries are considered equal:

```js
useQuery(['todos', { status, page }], ...)
useQuery(['todos', { page, status }], ...)
useQuery(['todos', { page, status, other: undefined }], ...)
```

The following query keys, however, are not equal. Array item order matters!

```js
useQuery(['todos', status, page], ...)
useQuery(['todos', page, status], ...)
useQuery(['todos', undefined, page, status], ...)
```

## If your query function depends on a variable, include it in your query key

Since query keys uniquely describe the data they are fetching, they should include any variables you use in your query function that **change**. For example:

```js
function Todos({ todoId }) {
  const result = useQuery(['todos', todoId], () => fetchTodoById(todoId))
}
```

## Further reading

For tips on organizing Query Keys in larger applications, have a look at [Effective React Query Keys](../community/tkdodos-blog#8-effective-react-query-keys) from
the Community Resources.
