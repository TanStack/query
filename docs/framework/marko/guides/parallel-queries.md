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

## Rendering Without Subscribing

Each of the three reading tags takes `subscribed`: `<query>`, `<infinite-query>` and `<queries>`. It defaults to `true`. Setting it to `false` stops the subscription: no fetch starts, and no later cache update reaches the tag. The tag still applies new options, so a change to the options, for example a reactive `queryKey`, renders the result of the new query.

Use it when a template needs to show a query without driving it:

- A tag that displays cached data but must not trigger a request, for example a summary panel on a page whose data another tag already loads.
- A tag that is about to unmount, where starting a fetch would only be cancelled.
- A `<queries>` list where the results feed a derivation and the page re-reads them elsewhere.

The query itself is unaffected. `subscribed: false` is a property of the tag, not of the query: the query stays enabled, keeps its cache entry, and other tags on the same key still fetch and update it.

```marko
<queries/counts options=() => ({
  queries: [allCountOptions, activeCountOptions],
  subscribed: false,
})/>
```

`<query>` and `<infinite-query>` take it in their options:

```marko
<infinite-query/feed options=() => ({ ...feedOptions, subscribed: false })/>
```

For `<queries>` it is one flag for the whole tag, so it is not accepted inside an entry of `queries`. A tag that does not subscribe also reports the cache's real `fetchStatus`: a query with no cached data shows `idle` rather than a fetch that never starts.

A snapshot pane shows the difference. Both tags read one key; only the first one follows the cache:

```marko
<query/live options=() => todosQueryOptions/>
<query/frozen options=() => ({ ...todosQueryOptions, subscribed: false })/>
```

Toggle a todo through `invalidateQueries` and the first list updates while the second keeps the data it rendered.

The `/subscribed` page of `examples/marko/basic` runs this pair. It also renders a tag on a key that is never prefetched, which reports `fetchStatus: idle` and starts no request.
