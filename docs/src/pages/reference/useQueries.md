---
id: useQueries
title: useQueries
---

The `useQueries` hook can be used to fetch a variable number of queries:

```js
const results = useQueries([
  { queryKey: ['post', 1], queryFn: fetchPost },
  { queryKey: ['post', 2], queryFn: fetchPost },
])
```

**Options**

The `useQueries` hook accepts an array with query option objects identical to the [`useQuery` hook](#usequery).

**Returns**

The `useQueries` hook returns an array with all the query results.

Proposed docs to add to the `useQueries` page:

**TypeScript users**

If you're using `react-query` with TypeScript then you'll be able to benefit from type inference:

```ts
const resultWithAllTheSameTypes = useQueries(
  [1, 2].map(x => ({ queryKey: `${x}`, queryFn: () => x }))
)
// resultWithAllTheSameTypes: QueryObserverResult<number, unknown>[]

const resultWithDifferentTypes = useQueries(
  [1, 'two', new Date()].map(x => ({ queryKey: `${x}`, queryFn: () => x }))
)
// resultWithDifferentTypes: QueryObserverResult<string | number | Date, unknown>[]
```

In both the examples above, no types were specified and the compiler correctly inferred the types from the array passed to `useQueries`.

However, if you pass an array literal *where different elements have a `queryFn` with differing return types* then the compiler will be able to correctly infer the positional types. Consider:

```ts
const resultWithoutUsingMap = useQueries([
  { queryKey: key1, queryFn: () => 1 },
  { queryKey: key2, queryFn: () => 'two' },
])

if (result[0].data) {
  const isANumber: number = result[0].data
}
if (result[1].data) {
  const isAString: string = result[1].data
}
```

