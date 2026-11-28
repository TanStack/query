---
id: typescript
title: TypeScript
---

React Query is now written in **TypeScript** to make sure the library and your projects are type-safe!

Things to keep in mind:

- TanStack Query follows [DefinitelyTyped's support window](https://github.com/DefinitelyTyped/DefinitelyTyped#support-window) and supports TypeScript versions released within the last 2 years. At the moment, that means TypeScript **5.7** and newer.
- Changes to types in this repository are considered **non-breaking** and are usually released as **patch** semver changes (otherwise every type enhancement would be a major version!).
- It is **highly recommended that you lock your react-query package version to a specific patch release and upgrade with the expectation that types may be fixed or upgraded between any release**
- The non-type-related public API of React Query still follows semver very strictly.

## Type Inference

Types in React Query generally flow through very well so that you don't have to provide type annotations for yourself

[//]: # 'TypeInference1'

```tsx
const { data } = useQuery(
  queryOptions({
    //    ^? const data: number | undefined
    queryKey: ['test'],
    queryFn: () => Promise.resolve(5),
  }),
)
```

[//]: # 'TypeInference1'
[//]: # 'TypeInference2'

```tsx
const { data } = useQuery(
  queryOptions({
    //      ^? const data: string | undefined
    queryKey: ['test'],
    queryFn: () => Promise.resolve(5),
    select: [select, (data) => data.toString()],
  }),
)
```

[//]: # 'TypeInference2'

This works best if your `queryFn` has a well-defined returned type. Keep in mind that most data fetching libraries return `any` per default, so make sure to extract it to a properly typed function:

[//]: # 'TypeInference3'

```tsx
const fetchGroups = (): Promise<Group[]> =>
  axios.get('/groups').then((response) => response.data)

const { data } = useQuery(
  queryOptions({ queryKey: ['groups'], queryFn: fetchGroups }),
)
//      ^? const data: Group[] | undefined
```

[//]: # 'TypeInference3'

## Type Narrowing

React Query uses a [discriminated union type](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes-func.html#discriminated-unions) for the query result. Checking `result.status` or passing the result to a type guard such as `isSuccess` narrows the same union. Read `result.data` after the check so TypeScript retains that relationship:

[//]: # 'TypeNarrowing'

```tsx
const queryResult = useQuery(
  queryOptions({
    queryKey: ['test'],
    queryFn: () => Promise.resolve(5),
  }),
)

if (isSuccess(queryResult)) {
  queryResult.data
  //          ^? number
}
```

[//]: # 'TypeNarrowing'

## Typing the error field

The type for error defaults to `Error`, because that is what most users expect.

[//]: # 'TypingError'

```tsx
const { error } = useQuery(
  queryOptions({ queryKey: ['groups'], queryFn: fetchGroups }),
)
//      ^? const error: Error | null
```

[//]: # 'TypingError'

If you want to throw a custom error, or something that isn't an `Error` at all, you can specify the type of the error field:

[//]: # 'TypingError2'

```tsx
const { error } = useQuery(
  queryOptions<Group[], string>({
    queryKey: ['groups'],
    queryFn: fetchGroups,
  }),
)
//      ^? const error: string | null
```

[//]: # 'TypingError2'

However, this has the drawback that type inference for the remaining generic parameters of `queryOptions` will not work anymore. It is generally not considered a good practice to throw something that isn't an `Error`, so if you have a subclass like `AxiosError` you can use _type narrowing_ to make the error field more specific:

[//]: # 'TypingError3'

```tsx
import axios from 'axios'

const { error } = useQuery(
  queryOptions({ queryKey: ['groups'], queryFn: fetchGroups }),
)
//      ^? const error: Error | null

if (axios.isAxiosError(error)) {
  error
  // ^? const error: AxiosError
}
```

[//]: # 'TypingError3'

### Registering a global Error

TanStack Query v5 allows for a way to set a global Error type for everything, without having to specify generics on call-sides, by amending the `Register` interface. This will make sure inference still works, but the error field will be of the specified type. If you want to enforce that call-sides must do explicit type-narrowing, set `defaultError` to `unknown`:

[//]: # 'RegisterErrorType'

```tsx
import '@tanstack/react-query'

declare module '@tanstack/react-query' {
  interface Register {
    // Use unknown so call sites must narrow explicitly.
    defaultError: unknown
  }
}

const { error } = useQuery(
  queryOptions({ queryKey: ['groups'], queryFn: fetchGroups }),
)
//      ^? const error: unknown | null
```

[//]: # 'RegisterErrorType'
[//]: # 'TypingMeta'

## Typing meta

### Registering global Meta

Similarly to registering a [global error type](#registering-a-global-error) you can also register a global `Meta` type. This ensures the optional `meta` field on [queries](./reference/functions/useQuery.md) and [mutations](./reference/functions/useMutation.md) stays consistent and is type-safe. Note that the registered type must extend `Record<string, unknown>` so that `meta` remains an object.

```ts
import '@tanstack/react-query'

interface MyMeta extends Record<string, unknown> {
  // Your meta type definition.
}

declare module '@tanstack/react-query' {
  interface Register {
    queryMeta: MyMeta
    mutationMeta: MyMeta
  }
}
```

[//]: # 'TypingMeta'
[//]: # 'TypingQueryAndMutationKeys'

## Typing query and mutation keys

### Registering the query and mutation key types

Also similarly to registering a [global error type](#registering-a-global-error), you can also register a global `QueryKey` and `MutationKey` type. This allows you to provide more structure to your keys, that matches your application's hierarchy, and have them be typed across all of the library's surface area. Note that the registered type must extend the `Array` type, so that your keys remain an array.

```ts
import '@tanstack/react-query'

type QueryKey = ['dashboard' | 'marketing', ...ReadonlyArray<unknown>]

declare module '@tanstack/react-query' {
  interface Register {
    queryKey: QueryKey
    mutationKey: QueryKey
  }
}
```

[//]: # 'TypingQueryAndMutationKeys'
[//]: # 'TypingQueryOptions'

## Typing Query Options

Define a reusable factory with `queryOptions`. Its descriptor carries the fetcher’s inferred data and error types into `useQuery` and client operations.

```ts
import { queryOptions, query } from '@tanstack/react-query'

function groupOptions() {
  return queryOptions({
    queryKey: ['groups'],
    queryFn: fetchGroups,
    staleTime: 5 * 1000,
  })
}

useQuery(groupOptions())
query(queryClient, groupOptions())
```

Further, the `queryKey` returned from `queryOptions` knows about the `queryFn` associated with it, and we can leverage that type information to make functions like `getQueryData` aware of those types as well:

```ts
function groupOptions() {
  return queryOptions({
    queryKey: ['groups'],
    queryFn: fetchGroups,
    staleTime: 5 * 1000,
  })
}

const data = getQueryData(queryClient, groupOptions().queryKey)
//     ^? const data: Group[] | undefined
```

Without `queryOptions`, the type of `data` would be `unknown`, unless we'd pass a generic to it:

```ts
const data = getQueryData<Group[]>(queryClient, ['groups'])
```

Note that type inference via `queryOptions` does _not_ work for `getQueriesData`, because it returns an array of tuples with heterogeneous, `unknown` data. If you are sure of the type of data that your query will return, specify it explicitly:

```ts
const entries = getQueriesData<Group[]>(queryClient, groupOptions().queryKey)
//     ^? const entries: Array<[QueryKey, Group[] | undefined]>
```

## Typing Mutation Options

Similarly to `queryOptions`, you can use `mutationOptions` to extract mutation options into a separate function:

```ts
function groupMutationOptions() {
  return mutationOptions({
    mutationKey: ['addGroup'],
    mutationFn: addGroup,
  })
}

useMutation({
  ...groupMutationOptions(),
  onSuccess: () => invalidateQueries(queryClient, { queryKey: ['groups'] }),
})
useIsMutating(groupMutationOptions())
isMutating(queryClient, groupMutationOptions())
```

[//]: # 'TypingQueryOptions'

## Typesafe disabling of queries using `skipToken`

If you are using TypeScript, you can use the `skipToken` to disable a query. This is useful when you want to disable a query based on a condition, but you still want to keep the query to be type safe.
Read more about it in the [Disabling Queries](./guides/disabling-queries.md) guide.

[//]: # 'Materials'

## Further Reading

For tips and tricks around type inference, see the article [React Query and TypeScript](https://tkdodo.eu/blog/react-query-and-type-script). To find out how to get the best possible type-safety, you can read [Type-safe React Query](https://tkdodo.eu/blog/type-safe-react-query). [The Query Options API](https://tkdodo.eu/blog/the-query-options-api) outlines how type inference works with the `queryOptions` helper function.

[//]: # 'Materials'
