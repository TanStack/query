---
id: parallel-queries
title: Parallel Queries
ref: docs/framework/react/guides/parallel-queries.md
replace:
  {
    'If the number of queries you need to execute is changing from render to render, you cannot use manual querying since that would violate the rules of hooks. Instead, ': '',
    'hook': 'function',
    'React': 'Angular',
    'hooks': 'functions',
    'useQuery': 'injectQuery',
    'useInfiniteQuery': 'injectInfiniteQuery',
    'useQueries': 'injectQueries',
  }
---

[//]: # 'Example'

```ts
@Component({
  // ...
})
export class AppComponent {
  // The following queries will execute in parallel
  usersQuery = injectQuery(() => ({ queryKey: ['users'], queryFn: fetchUsers }))
  teamsQuery = injectQuery(() => ({ queryKey: ['teams'], queryFn: fetchTeams }))
  projectsQuery = injectQuery(() => ({
    queryKey: ['projects'],
    queryFn: fetchProjects,
  }))
}
```

[//]: # 'Example'
[//]: # 'Info'
[//]: # 'Info'
[//]: # 'DynamicParallelIntro'

TanStack Query provides `injectQueries`, which you can use to dynamically execute as many queries in parallel as you'd like.

[//]: # 'DynamicParallelIntro'
[//]: # 'Example2'

```ts
@Component({
  // ...
})
export class AppComponent {
  users = signal<Array<User>>([])

  userQueries = injectQueries(() => ({
    queries: this.users().map((user) => {
      return {
        queryKey: ['user', user.id],
        queryFn: () => fetchUserById(user.id),
      }
    }),
  }))
}
```

[//]: # 'Example2'
