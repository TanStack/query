---
id: render-optimizations
title: Render Optimizations
---

React Query applies a couple of optimizations automatically to ensure that your components only re-render when they actually need to. This is done by the following means:

## structural sharing

React Query uses a technique called "structural sharing" to ensure that as many references as possible will be kept intact between re-renders. If data is fetched over the network, usually, you'll get a completely new reference by json parsing the response. However, React Query will keep the original reference if _nothing_ changed in the data. If a subset changed, React Query will keep the unchanged parts and only replace the changed parts.

> Note: This optimization only works if the `queryFn` returns JSON compatible data. You can turn it off by setting `structuralSharing: false` globally or on a per-query basis, or you can implement your own structural sharing by passing a function to it.

### referential identity

The top level object returned from `useQuery`, `useInfiniteQuery`, `useMutation` and the Array returned from `useQueries` is **not referentially stable**. It will be a new reference on every render. However, the `data` properties returned from these hooks will be as stable as possible.

## tracked properties

React Query will only trigger a re-render if one of the properties returned from `useQuery` is actually "used". This is done by using [Proxy object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy). This avoids a lot of unnecessary re-renders, e.g. because properties like `isFetching` or `isStale` might change often, but are not used in the component.

You can customize this feature by setting `notifyOnChangeProps` manually globally or on a per-query basis. If you want to turn that feature off, you can set `notifyOnChangeProps: 'all'`.

> Note: The get trap of a proxy is invoked by accessing a property, either via destructuring or by accessing it directly. If you use object rest destructuring, you will disable this optimization. We have a [lint rule](../../../eslint/no-rest-destructuring.md) to guard against this pitfall.

## select

You can use the `select` option to select a subset of the data that your component should subscribe to. This is useful for highly optimized data transformations or to avoid unnecessary re-renders.

```js
export const useTodos = (select) => {
  return useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos,
    select,
  })
}

export const useTodoCount = () => {
  return useTodos((data) => data.length)
}
```

A component using the `useTodoCount` custom hook will only re-render if the length of the todos changes. It will **not** re-render if e.g. the name of a todo changed.

> Note: `select` operates on successfully cached data and is not the appropriate place to throw errors. The source of truth for errors is the `queryFn`, and a `select` function that returns an error results in `data` being `undefined` and `isSuccess` being `true`. We recommend handling errors in the `queryFn` if you wish to have a query fail on incorrect data, or outside of the query hook if you have a error case not related to caching.

### memoization

The `select` function will only re-run if:

- the `select` function itself changed referentially
- `data` changed

This means that an inlined `select` function, as shown above, will run on every render. To avoid this, you can wrap the `select` function in `useCallback`, or extract it to a stable function reference if it doesn't have any dependencies:

```js
// wrapped in useCallback
export const useTodoCount = () => {
  return useTodos(useCallback((data) => data.length, []))
}
```

```js
// extracted to a stable function reference
const selectTodoCount = (data) => data.length

export const useTodoCount = () => {
  return useTodos(selectTodoCount)
}
```

## Further Reading

For an in-depth guide about these topics, read [React Query Render Optimizations](../community/tkdodos-blog.md#3-react-query-render-optimizations) from
the Community Resources.
