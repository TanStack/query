---
id: typescript
title: TypeScript
ref: docs/framework/react/typescript.md
replace:
  {
    'React': 'Vue',
    '@tanstack/react-query': '@tanstack/vue-query',
    'react-query package version': 'vue-query package version',
  }
---

[//]: # 'TypeInference1'

```tsx
const { data } = useQuery({
  //    ^? const data: Ref<number> | Ref<undefined>
  queryKey: ['test'],
  queryFn: () => Promise.resolve(5),
})
```

[typescript playground](https://www.typescriptlang.org/play?#code/JYWwDg9gTgLgBAbzgVwM4FMCKz1QJ5wC+cAZlBCHAOQACMAhgHaoMDGA1gPQBuOAtAEcc+KgFgAUBNYRm8JABN6DInAC8KDNlx4AFAglw4nTocMA9APwG4Q7QGl0eAFxwA2lRjoWVALoAaa1t8ADFGFx0ASjUAPjgABXIQYAwAOigvCAAbbnQdAFYIgPFCCKA)

[//]: # 'TypeInference1'
[//]: # 'TypeInference2'

```tsx
const { data } = useQuery({
  //      ^? const data: Ref<string> | Ref<undefined>
  queryKey: ['test'],
  queryFn: () => Promise.resolve(5),
  select: (data) => data.toString(),
})
```

[typescript playground](https://www.typescriptlang.org/play?#code/JYWwDg9gTgLgBAbzgVwM4FMCKz1QJ5wC+cAZlBCHAOQACMAhgHaoMDGA1gPQBuOAtAEcc+KgFgAUBNYRm8JABN6DInAC8KDNlx4AFAglw4nTodNwAegH4DcIdoDS6PAC44AbSox0LKgF0ANDZ2+ABijK46AJRqAHxwAArkIMAYAHRQ3hAANtzoOgCskYHihhhZ6KwwEYoM0apxNfSpMBAAyjBQwIwA5lHFhJFAA)

[//]: # 'TypeInference2'
[//]: # 'TypeInference3'

```tsx
const fetchGroups = (): Promise<Group[]> =>
  axios.get('/groups').then((response) => response.data)

const { data } = useQuery({ queryKey: ['groups'], queryFn: fetchGroups })
//      ^? const data: Ref<Group[]> | Ref<undefined>
```

[typescript playground](https://www.typescriptlang.org/play?#code/JYWwDg9gTgLgBAbzgVwM4FMCKz1QJ5wC+cAZlBCHAOQACMAhgHaoMDGA1gPQBuOAtAEcc+KgFgAUKEiw49AB7AIqUuUpV5i1GPESYeMOjgBxcsjBwAvIjjAAJgC44jZCABGuIhImsIzeCXQYVgALEwgzZSsACgBKRwAFVWAMAB4wswBtAF0APksciThZBSUAOgBzQKiqTnLTMC0Y0phg9EYoqKh0VEhmdBj8uC6e3wxS23oGGK9xHz9rCYYiSxQMbFw8KKQhDYBpdDxHDKo68IaqLIAaOB38ADFGRwCg0PrlQmnxTk4i37gAPQA-EA)

[//]: # 'TypeInference3'
[//]: # 'TypeNarrowing'

```tsx
const { data, isSuccess } = reactive(
  useQuery({
    queryKey: ['test'],
    queryFn: () => Promise.resolve(5),
  }),
)

if (isSuccess) {
  data
  // ^? const data: number
}
```

[typescript playground](https://www.typescriptlang.org/play?#code/JYWwDg9gTgLgBAbzgVwM4FMCKz1QJ5wC+cAZlBCHAOQACMAhgHaoMDGA1gPQBuOAtAEcc+KgFgAUKEixEcKOnqsYwbuiKlylKr3RUA3BImsIzeEgAm9BgBo4wVAGVkrVulSp1AXjkKlK9AAUaFjCeAEA2lQwbjBUALq2AQCUcJ4AfHAACpr26AB08qgQADaqAQCsSVWGkiRwAfZOLm6oKQgScJ1wlgwSnJydAHoA-BKEEkA)

[//]: # 'TypeNarrowing'
[//]: # 'TypingError'

```tsx
const { error } = useQuery({ queryKey: ['groups'], queryFn: fetchGroups })
//      ^? const error: Ref<unknown>

if (error.value instanceof Error) {
  error.value
  //     ^? const error: Error
}
```

[typescript playground](https://www.typescriptlang.org/play?#code/JYWwDg9gTgLgBAbzgVwM4FMCKz1QJ5wC+cAZlBCHAOQACMAhgHaoMDGA1gPRTr2swBaAI458VALAAoUJFhx6AD2ARUpcpSqLlqCZKkw8YdHADi5ZGDgBeRHGAATAFxxGyEACNcRKVNYRm8CToMKwAFmYQFqo2ABQAlM4ACurAGAA8ERYA2gC6AHzWBVoqAHQA5sExVJxl5mA6cSUwoeiMMTyokMzGVgUdXRgl9vQMcT6SfgG2uORQRNYoGNi4eDFIIisA0uh4zllUtZH1VDkANHAb+ABijM5BIeF1qoRjkpyccJ9fAHoA-OPAEhwGLFVAlVIAQSUKgAolBZjEZtA4nFEFJPkioOi4O84H8pIQgA)

[//]: # 'TypingError'
[//]: # 'TypingError2'
[//]: # 'TypingError2'
[//]: # 'TypingError3'
[//]: # 'TypingError3'
[//]: # 'RegisterErrorType'

```tsx
import '@tanstack/vue-query'

declare module '@tanstack/vue-query' {
  interface Register {
    // Use unknown so call sites must narrow explicitly.
    defaultError: unknown
  }
}

const { error } = useQuery({ queryKey: ['groups'], queryFn: fetchGroups })
//      ^? const error: unknown | null
```

[//]: # 'RegisterErrorType'
[//]: # 'TypingMeta'
[//]: # 'TypingMeta'
[//]: # 'TypingQueryOptions'
[//]: # 'TypingQueryOptions'
[//]: # 'Materials'
[//]: # 'Materials'
