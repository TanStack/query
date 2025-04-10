---
id: typescript
title: TypeScript
---

Solid Query is written in **TypeScript** to make sure the library and your projects are type-safe!

Things to keep in mind:

- Types currently require using TypeScript **v4.7** or greater
- Changes to types in this repository are considered **non-breaking** and are usually released as **patch** semver changes (otherwise every type enhancement would be a major version!).
- It is **highly recommended that you lock your solid-query package version to a specific patch release and upgrade with the expectation that types may be fixed or upgraded between any release**
- The non-type-related public API of Solid Query still follows semver very strictly.

## Type Inference

Types in Solid Query generally flow through very well so that you don't have to provide type annotations for yourself

```tsx
import { useQuery } from '@tanstack/solid-query'

const query = useQuery(() => ({
  queryKey: ['number'],
  queryFn: () => Promise.resolve(5),
}))

query.data
//    ^? (property) data: number | undefined
```

[typescript playground](https://www.typescriptlang.org/play/?#code/JYWwDg9gTgLgBAbzgYygUwIYzQRQK5pQCecAvnAGZQQhwDkAAjBgHYDOzyA1gPRsQAbYABMAtAEcCxOgFgAUPOQR28SYRIBeFOiy4pRABQGAlHA0A+OAYTy4duGuIBpNEQBccANp0WeEACNCOgBdABo4W3tHIgAxFg8TM0sABWoQYDY0ADp0fgEANzQDAFZjeVJjMoU5aKzhLAx5Hh57OAA9AH55brkgA)

```tsx
import { useQuery } from '@tanstack/solid-query'

const query = useQuery(() => ({
  queryKey: ['test'],
  queryFn: () => Promise.resolve(5),
  select: (data) => data.toString(),
}))

query.data
//    ^? (property) data: string | undefined
```

[typescript playground](https://www.typescriptlang.org/play/?#code/JYWwDg9gTgLgBAbzgYygUwIYzQRQK5pQCecAvnAGZQQhwDkAAjBgHYDOzyA1gPRsQAbYABMAtAEcCxOgFgAUPOQR28SYRIBeFOiy4pRABQGAlHA0A+OAYTy4duGuIBpNEQBccANp1sHOgF0AGjhbe0ciADEWDxMzSwAFahBgNjQAOnR+AQA3NAMAVmNA0LtUgTRkGBjhLAxTCzga5jSYCABlGChgFgBzE2K5UmNjeXlwtKaMeR4eezgAPQB+UYU5IA)

This works best if your `queryFn` has a well-defined returned type. Keep in mind that most data fetching libraries return `any` per default, so make sure to extract it to a properly typed function:

```tsx
const fetchGroups = (): Promise<Group[]> =>
  axios.get('/groups').then((response) => response.data)

const query = useQuery(() => ({
  queryKey: ['groups'],
  queryFn: fetchGroups,
}))

query.data
//    ^? (property) data: Group[] | undefined
```

[typescript playground](https://www.typescriptlang.org/play/?ssl=11&ssc=4&pln=6&pc=1#code/JYWwDg9gTgLgBAbzgYygUwIYzQRQK5pQCecAvnAGZQQhwDkAAjBgHYDOzyA1gPRsQAbYABMAtAEcCxOgFgAUKEiw4GAB7AIbStVp01GtrLnyYRMGjgBxanjBwAvIjgiAXHBZ4QAI0Jl585Ah2eAo0GGQAC2sIWy1HAAoASjcABR1gNjQAHmjbAG0AXQA+BxL9TQA6AHMw+LoeKpswQ0SKmAi0Fnj0Nkh2C3sSnr7MiuEsDET-OUDguElCEkdUTGx8Rfik0rh4hHk4A-mpIgBpNCI3PLpGmOa6AoAaOH3DheIAMRY3UPCoprYHvJSIkpsY5G8iGMJvIeDxDnAAHoAfmm8iAA)

## Type Narrowing

Solid Query uses a [discriminated union type](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes-func.html#discriminated-unions) for the query result, discriminated by the `status` field and the derived status boolean flags. This will allow you to check for e.g. `success` status to make `data` defined:

```tsx
const query = useQuery(() => ({
  queryKey: ['number'],
  queryFn: () => Promise.resolve(5),
}))

if (query.isSuccess) {
  const data = query.data
  //     ^? const data: number
}
```

[typescript playground](https://www.typescriptlang.org/play/?#code/JYWwDg9gTgLgBAbzgYygUwIYzQRQK5pQCecAvnAGZQQhwDkAAjBgHYDOzyA1gPRsQAbYABMAtAEcCxOgFgAUKEixEKdFjQBRChTTJ45KjXr8hYgFZtZc+cgjt4kwiQC8qzNnxOAFF4CUcZwA+OC8EeTg4R2IAaTQiAC44AG06FjwQACNCOgBdABpwyKkiADEWRL8A4IAFahBgNjQAOnQTADc0LwBWXwK5Ul9feXlgChCooiaGgGU8ZGQ0NjZ-MLkIiNt7OGEsDACipyad5kKInh51iIA9AH55UmHrOSA)

## Typing the error field

The type for error defaults to `Error`, because that is what most users expect.

```tsx
const query = useQuery(() => ({
  queryKey: ['groups'],
  queryFn: fetchGroups,
}))

query.error
//    ^? (property) error: Error | null
```

[typescript playground](https://www.typescriptlang.org/play/?#code/JYWwDg9gTgLgBAbzgYygUwIYzQRQK5pQCecAvnAGZQQhwDkAAjBgHYDOzyA1gPRsQAbYABMAtAEcCxOgFgAUKEiw4GAB7AIbStVp01GtrLnyYRMGjgBxanjBwAvIjgiAXHBZ4QAI0Jl585Ah2eAo0GGQAC2sIWy1HAAoASjcABR1gNjQAHmjbAG0AXQA+BxL9TQA6AHMw+LoeKpswQ0SKmAi0Fnj0Nkh2C3sSnr7MiuEsDET-OUDguElCEkdUTGx8Rfik0rh4hHk4A-mpIgBpNCI3PLpGmOa6AoAaOH3DheIAMRY3UPCoprYHvJSIkpsY5G8iBVCNQoPIeDxDnAAHoAfmm8iAA)

If you want to throw a custom error, or something that isn't an `Error` at all, you can specify the type of the error field:

```tsx
const query = useQuery<Group[], string>(() => ({
  queryKey: ['groups'],
  queryFn: fetchGroups,
}))

query.error
//    ^? (property) error: string | null
```

However, this has the drawback that type inference for all other generics of `useQuery` will not work anymore. It is generally not considered a good practice to throw something that isn't an `Error`, so if you have a subclass like `AxiosError` you can use _type narrowing_ to make the error field more specific:

```tsx
import axios from 'axios'

const query = useQuery(() => ({
  queryKey: ['groups'],
  queryFn: fetchGroups,
}))

query.error
//    ^? (property) error: Error | null

if (axios.isAxiosError(query.error)) {
  query.error
  //    ^? (property) error: AxiosError
}
```

[typescript playground](https://www.typescriptlang.org/play/?#code/JYWwDg9gTgLgBAbzgYygUwIYzQRQK5pQCecAvnAGZQQhwDkAAjBgHYDOzyA1gPRsQAbYABMAtAEcCxOgFgAUKEiw4GAB7AIbStVp01GtrLnyYRMGjgBxanjBwAvIjgiAXHBZ4QAI0Jl585Ah2eAo0GGQAC2sIWy1HAAoASjcABR1gNjQAHmjbAG0AXQA+BxL9TQA6AHMw+LoeKpswQ0SKmAi0Fnj0Nkh2C3sSnr7MiuEsDET-OUDguElCEkdUTGx8Rfik0rh4hHk4A-mpIgBpNCI3PLpGmOa6AoAaOH3DheIAMRY3UPCoprYHvJSIkpsY5G8iBVCNQoPIeDxDnAAHoAfmmwAoO3KbAqGQAgupNABRKAw+IQqGk6AgxAvA4U6HQOlweGI1FA+RAA)

## Registering a global `Error`

TanStack Query v5 allows for a way to set a global Error type for everything, without having to specify generics on call-sides, by amending the `Register` interface. This will make sure inference still works, but the error field will be of the specified type:

```tsx
import '@tanstack/solid-query'

declare module '@tanstack/solid-query' {
  interface Register {
    defaultError: AxiosError
  }
}

const query = useQuery(() => ({
  queryKey: ['groups'],
  queryFn: fetchGroups,
}))

query.error
//    ^? (property) error: AxiosError | null
```

## Registering global `Meta`

Similarly to registering a [global error type](#registering-a-global-error) you can also register a global `Meta` type. This ensures the optional `meta` field on [queries](../useQuery) and [mutations](../createMutation) stays consistent and is type-safe. Note that the registered type must extend `Record<string, unknown>` so that `meta` remains an object.

```ts
import '@tanstack/solid-query'

interface MyMeta extends Record<string, unknown> {
  // Your meta type definition.
}

declare module '@tanstack/solid-query' {
  interface Register {
    queryMeta: MyMeta
    mutationMeta: MyMeta
  }
}
```

## Typing Query Options

If you inline query options into `useQuery`, you'll get automatic type inference. However, you might want to extract the query options into a separate function to share them between `useQuery` and e.g. `prefetchQuery`. In that case, you'd lose type inference. To get it back, you can use `queryOptions` helper:

```ts
import { queryOptions } from '@tanstack/solid-query'

function groupOptions() {
  return queryOptions({
    queryKey: ['groups'],
    queryFn: fetchGroups,
    staleTime: 5 * 1000,
  })
}

useQuery(groupOptions)
queryClient.prefetchQuery(groupOptions())
```

Further, the `queryKey` returned from `queryOptions` knows about the `queryFn` associated with it, and we can leverage that type information to make functions like `queryClient.getQueryData` aware of those types as well:

```ts
function groupOptions() {
  return queryOptions({
    queryKey: ['groups'],
    queryFn: fetchGroups,
    staleTime: 5 * 1000,
  })
}

const data = queryClient.getQueryData(groupOptions().queryKey)
//    ^? const data: Group[] | undefined
```

Without `queryOptions`, the type of `data` would be `unknown`, unless we'd pass a generic to it:

```ts
const data = queryClient.getQueryData<Group[]>(['groups'])
```

## Typesafe disabling of queries using `skipToken`

If you are using TypeScript, you can use the `skipToken` to disable a query. This is useful when you want to disable a query based on a condition, but you still want to keep the query to be type safe.

Read more about it in the [Disabling Queries](../disabling-queries) guide.
