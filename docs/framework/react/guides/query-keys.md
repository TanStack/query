---
id: query-keys
title: Query Keys
---

At its core, TanStack Query manages query caching for you based on query keys. Query keys have to be an Array at the top level, and can be as simple as an Array with a single string, or as complex as an array of many strings and nested objects. As long as the query key is serializable using `JSON.stringify`, and **unique to the query's data**, you can use it!

## Simple Query Keys

The simplest form of a key is an array with constants values. This format is useful for:

- Generic List/Index resources
- Non-hierarchical resources

[//]: # 'Example'

```tsx
// A list of todos
useQuery({ queryKey: ['todos'], ... })

// Something else, whatever!
useQuery({ queryKey: ['something', 'special'], ... })
```

[//]: # 'Example'

## Array Keys with variables

When a query needs more information to uniquely describe its data, you can use an array with a string and any number of serializable objects to describe it. This is useful for:

- Hierarchical or nested resources
  - It's common to pass an ID, index, or other primitive to uniquely identify the item
- Queries with additional parameters
  - It's common to pass an object of additional options

[//]: # 'Example2'

```tsx
// An individual todo
useQuery({ queryKey: ['todo', 5], ... })

// An individual todo in a "preview" format
useQuery({ queryKey: ['todo', 5, { preview: true }], ...})

// A list of todos that are "done"
useQuery({ queryKey: ['todos', { type: 'done' }], ... })
```

[//]: # 'Example2'

## Query Keys are hashed deterministically!

This means that no matter the order of keys in objects, all of the following queries are considered equal:

[//]: # 'Example3'

```tsx
useQuery({ queryKey: ['todos', { status, page }], ... })
useQuery({ queryKey: ['todos', { page, status }], ...})
useQuery({ queryKey: ['todos', { page, status, other: undefined }], ... })
```

[//]: # 'Example3'

The following query keys, however, are not equal. Array item order matters!

[//]: # 'Example4'

```tsx
useQuery({ queryKey: ['todos', status, page], ... })
useQuery({ queryKey: ['todos', page, status], ...})
useQuery({ queryKey: ['todos', undefined, page, status], ...})
```

[//]: # 'Example4'

## Custom query key values

If a `queryKey` contains values that need custom serialization, configure the serializer on the `QueryCache`. The serializer is used for hashing and partial matching of every query in that cache.

The serializer must be idempotent. The same key can be serialized more than once, so serializing an already serialized value must return the same value.

```tsx
const queryCache = new QueryCache({
  valueSerializer: (value) => {
    if (value instanceof Date) {
      return value.toISOString()
    }

    return value
  },
})

const queryClient = new QueryClient({ queryCache })
```

When a serializer is configured, the original `queryKey` remains available to
query APIs and query function contexts. The serialized key is stored separately
and is used internally for hashing and matching. Configure `MutationCache`
separately if mutation keys need custom serialization.

If `hashFn` is provided on `QueryCache`, it receives this serialized key. The
serialized key is used for matching, dehydration, and persistence. A query that
is created only from restored data initially exposes this stored key. When the
query runs with normal query options, its query function receives the original
key from those options. The cache key configuration must not change while the
cache contains entries. A cache that restores dehydrated or persisted entries
must use a compatible key configuration.

## If your query function depends on a variable, include it in your query key

Since query keys uniquely describe the data they are fetching, they should include any variables you use in your query function that **change**. For example:

[//]: # 'Example5'

```tsx
function Todos({ todoId }) {
  const result = useQuery({
    queryKey: ['todos', todoId],
    queryFn: () => fetchTodoById(todoId),
  })
}
```

[//]: # 'Example5'

Note that query keys act as dependencies for your query functions. Adding dependent variables to your query key will ensure that queries are cached independently, and that any time a variable changes, _queries will be refetched automatically_ (depending on your `staleTime` settings). See the [exhaustive-deps](../../../eslint/exhaustive-deps.md) section for more information and examples.

[//]: # 'Materials'

## Further reading

For tips on organizing Query Keys in larger applications, have a look at [Effective React Query Keys](https://tkdodo.eu/blog/effective-react-query-keys) and check the [Query Key Factory Package](https://github.com/lukemorales/query-key-factory) from
the [Community Resources](../../../community-resources).

[//]: # 'Materials'
