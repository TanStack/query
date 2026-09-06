---
id: Updater
title: Updater
---

```ts
type Updater<TInput, TOutput> = TOutput | (input) => TOutput;
```

Defined in: [packages/query-core/src/utils.ts:105](https://github.com/TanStack/query/blob/main/packages/query-core/src/utils.ts#L105)

Either a plain value of type `TOutput`, or a function that receives `TInput` and returns `TOutput`.
Used for example by `setQueryData`-style updaters, which accept either the new data directly or a
function that computes it from the previous data. See functionalUpdate.

## Type Parameters

### TInput

`TInput`

### TOutput

`TOutput`

## Example

```ts
queryClient.setQueryData(['posts'], newPosts)

// Or, using an updater function that receives the current data:
queryClient.setQueryData(['posts'], (oldPosts) =>
  oldPosts ? [...oldPosts, newPost] : oldPosts,
)
```
