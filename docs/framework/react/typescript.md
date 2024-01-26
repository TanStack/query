---
id: typescript
title: TypeScript
---

React Query is now written in **TypeScript** to make sure the library and your projects are type-safe!

Things to keep in mind:

- Types currently require using TypeScript v4.1 or greater
- Changes to types in this repository are considered **non-breaking** and are usually released as **patch** semver changes (otherwise every type enhancement would be a major version!).
- It is **highly recommended that you lock your react-query package version to a specific patch release and upgrade with the expectation that types may be fixed or upgraded between any release**
- The non-type-related public API of React Query still follows semver very strictly.

## Type Inference

Types in React Query generally flow through very well so that you don't have to provide type annotations for yourself

[//]: # 'TypeInference1'

```tsx
const { data } = useQuery({
  //    ^? const data: number | undefined
  queryKey: ['test'],
  queryFn: () => Promise.resolve(5),
})
```

[typescript playground](https://www.typescriptlang.org/play?#code/JYWwDg9gTgLgBAbzgVwM4FMCKz1QJ5wC+cAZlBCHAORToCGAxjALQCOO+VAsAFC8MQAdqnhIAJnRh0icALwoM2XHgAUAbSqDkIAEa4qAXQA0cFQEo5APjgAFciGAYAdLVQQANgDd0KgKxmzXgB6ILgw8IA9AH5eIA)

[//]: # 'TypeInference1'
[//]: # 'TypeInference2'

```tsx
const { data } = useQuery({
  //      ^? const data: string | undefined
  queryKey: ['test'],
  queryFn: () => Promise.resolve(5),
  select: (data) => data.toString(),
})
```

[typescript playground](https://www.typescriptlang.org/play?#code/JYWwDg9gTgLgBAbzgVwM4FMCKz1QJ5wC+cAZlBCHAORToCGAxjALQCOO+VAsAFC8MQAdqnhIAJnRh0icALwoM2XHgAUAbSox0IqgF0ANHBUBKOQD44ABXIhgGAHS1UEADYA3dCoCsxw0gwu6EwAXHASUuZhknT2MBAAyjBQwIIA5iaExrwA9Nlw+QUAegD8vEA)

[//]: # 'TypeInference2'

This works best if your `queryFn` has a well-defined returned type. Keep in mind that most data fetching libraries return `any` per default, so make sure to extract it to a properly typed function:

[//]: # 'TypeInference3'

```tsx
const fetchGroups = (): Promise<Group[]> =>
  axios.get('/groups').then((response) => response.data)

const { data } = useQuery({ queryKey: ['groups'], queryFn: fetchGroups })
//      ^? const data: Group[] | undefined
```

[typescript playground](https://www.typescriptlang.org/play?#code/JYWwDg9gTgLgBAbzgVwM4FMCKz1QJ5wC+cAZlBCHAORToCGAxjALQCOO+VAsAFCiSw4dAB7AIqUuUpURY1Nx68YeMOjgBxcsjBwAvIjjAAJgC44AO2QgARriK9eDCOdTwS6GAwAWmiNon6ABQAlGYAClLAGAA8vtoA2gC6AHx6qbLiAHQA5h6BVAD02Vpg8sGZMF7o5oG0qJAuarqpdQ0YmUZ0MHTBDjxOLvBInd1EeigY2Lh4gfFUxX6lVIkANKQe3nGlvTwFBXAHhwB6APxwA65wI3RmW0lwAD4o5kboJMDm6Ea8QA)

[//]: # 'TypeInference3'

## Type Narrowing

React Query uses a [discriminated union type](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes-func.html#discriminated-unions) for the query result, discriminated by the `status` field and the derived status boolean flags. This will allow you to check for e.g. `success` status to make `data` defined:

[//]: # 'TypeNarrowing'

```tsx
const { data, isSuccess } = useQuery({
  queryKey: ['test'],
  queryFn: () => Promise.resolve(5),
})

if (isSuccess) {
  data
  //  ^? const data: number
}
```

[typescript playground](https://www.typescriptlang.org/play?#code/JYWwDg9gTgLgBAbzgVwM4FMCKz1QJ5wC+cAZlBCHAORToCGAxjALQCOO+VAsAFC8MQAdqnhIAJnRh0ANHGCoAysgYN0qVETgBeFBmy48ACgDaVGGphUAurMMBKbQD44ABXIh56AHS1UEADYAbuiGAKx2dry8wCRwhvJKKmqoDgi8cBlwElK8APS5GQB6APy8hLxAA)

[//]: # 'TypeNarrowing'

## Typing the error field

The type for error defaults to `unknown`. This is in line with what TypeScript gives you per default in a catch clauses (see [useUnknownInCatchVariables](https://devblogs.microsoft.com/typescript/announcing-typescript-4-4/#use-unknown-catch-variables)). The safest way to work with `error` would be to perform a runtime check; another way would be to explicitly define types for `data` and `error`:

[//]: # 'TypingError'

```tsx
const { error } = useQuery({ queryKey: ['groups'], queryFn: fetchGroups })
//      ^? const error: unknown

if (error instanceof Error) {
  error
  // ^? const error: Error
}
```

[typescript playground](https://www.typescriptlang.org/play?#code/JYWwDg9gTgLgBAbzgVwM4FMCKz1QJ5wC+cAZlBCHAORToCGAxjALQCOO+VAsAFCiSw4dAB7AIqUuUpURY1Nx68YeMOjgBxcsjBwAvIjjAAJgC44AO2QgARriK9eDCOdTwS6GAwAWmiNon6ABQAlGYAClLAGAA8vtoA2gC6AHx6qbLiAHQA5h6BVAD02Vpg8sGZMF7o5oG0qJAuarqpdQ0YmUZ0MHTBDjxOLvBIuORQRHooGNi4eIHxVMV+pVSJADSkHt5xpb08BQVwh0cAegD8fcAkcIEj0IaDdOYM6BBXAKJQo8GIvIe3ULx9nAzrxCEA)

[//]: # 'TypingError'
[//]: # 'TypingError2'

```tsx
const { error } = useQuery<Group[], Error>(['groups'], fetchGroups)
//      ^? const error: Error | null
```

[typescript playground](https://www.typescriptlang.org/play?#code/JYWwDg9gTgLgBAbzgVwM4FMCKz1QJ5wC+cAZlBCHAORToCGAxjALQCOO+VAsAFCiSw4dAB7AIqUuUpURY1Nx68YeMOjgBxcsjBwAvIjjAAJgC44AO2QgARriK9eDCOdTwS6GAwAWmiNon6ABQAlGYAClLAGAA8vtoA2gC6AHx6qbLiAHQA5h6BVAD02Vpg8sGZMF7o5oG0qJAuarqpdQ0YmUZ0MHTBDjxOLvBIuORQRHooGNi4eLElSQA0cACiUKPJgfFUxX6lVIlL7p4+Jai9PAUFcNc3AHoA-LxAA)

[//]: # 'TypingError2'
[//]: # 'Materials'

## Further Reading

For tips and tricks around type inference, have a look at [React Query and TypeScript](./community/tkdodos-blog#6-react-query-and-typescript) from
the Community Resources. To find out how to get the best possible type-safety, you can read [Type-safe React Query](./community/tkdodos-blog#19-type-safe-react-query).

[//]: # 'Materials'
[//]: # 'Materials'
