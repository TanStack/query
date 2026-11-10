---
id: parallel-queries
title: Parallel Queries
---

Parallel queries are queries that run at the same time so the UI does not wait for one request before starting the next.

## Manual Parallel Queries

When the number of queries is fixed, use one `<query>` tag for each query in the same template. They all subscribe when the template mounts:

```marko
<query/users options=() => ({ queryKey: ["users"], queryFn: fetchUsers })/>
<query/teams options=() => ({ queryKey: ["teams"], queryFn: fetchTeams })/>
<query/projects options=() => ({ queryKey: ["projects"], queryFn: fetchProjects })/>

<if=(users.isPending || teams.isPending || projects.isPending)>
  <p>Loading...</p>
</if>
<else-if=(users.isError || teams.isError || projects.isError)>
  <p>Unable to load dashboard</p>
</else-if>
<else>
  <dashboard-summary
    users=users.data
    teams=teams.data
    projects=projects.data
  />
</else>
```

## Dynamic Parallel Queries

When the number of queries changes with your data, use `<queries>`. Its `options` function returns an object with a `queries` array, and the tag returns an array of query results:

```marko
export interface Input {
  userIds: string[];
}

<queries/users options=() => ({
  queries: input.userIds.map((id) => ({
    queryKey: ["user", id],
    queryFn: () => fetchUserById(id),
  })),
})/>

<ul>
  <for|user, index| of=users>
    <if=user.isPending>
      <li>Loading...</li>
    </if>
    <else-if=user.isError>
      <li>Error loading user</li>
    </else-if>
    <else>
      <li>${input.userIds[index]}: ${user.data.name}</li>
    </else>
  </for>
</ul>
```

The order of the results matches the order of the input queries. Each result has its own `refetch`.

## Combining Results

Use `combine` when a template wants one derived value instead of an array of query results. The tag then returns what `combine` returns:

```marko
<queries/dashboard options=() => ({
  queries: [
    { queryKey: ["stats"], queryFn: fetchStats },
    { queryKey: ["projects"], queryFn: fetchProjects },
  ],
  combine: ([stats, projects]) => ({
    activeUsers: stats.data?.activeUsers ?? 0,
    projects: projects.data ?? [],
    isPending: stats.isPending || projects.isPending,
    isError: stats.isError || projects.isError,
  }),
})/>

<if=dashboard.isPending>
  <p>Loading...</p>
</if>
<else-if=dashboard.isError>
  <p>Unable to load dashboard</p>
</else-if>
<else>
  <p>Total projects: ${dashboard.projects.length}</p>
  <p>Active users: ${dashboard.activeUsers}</p>
</else>
```

Two entries with the same query key share one cache entry and one fetch. Give each row a distinct key when the rows need different data or independent query state, and deduplicate only when the rows can share data.
