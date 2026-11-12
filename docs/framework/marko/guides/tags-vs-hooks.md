---
id: tags-vs-hooks
title: Tags vs Hooks
---

Marko Query subscribes a template to a `QueryClient` with tags. A tag reads the latest result and updates the template when the cache changes. Tags are the integration point because Marko renders on the server and then resumes in the browser. The browser does not run the template again from the start. It receives the values that the browser code needs, serialized by the server.

## Mapping the Concepts

The table maps the hook-based API of the other TanStack Query adapters to the tags of Marko Query.

| React Query                      | Marko Query                                         |
| -------------------------------- | --------------------------------------------------- |
| `useQuery(options)`              | `<query/result options=() => options/>`             |
| `useQueries({ queries })`        | `<queries/results options=() => ({ queries })/>`    |
| `useInfiniteQuery(options)`      | `<infinite-query/result options=() => options/>`    |
| `useMutation(options)`           | `<mutation/result options=() => options/>`          |
| `useIsFetching(filters)`         | `<is-fetching/count filters=() => filters/>`        |
| `useIsMutating(filters)`         | `<is-mutating/count filters=() => filters/>`        |
| `useMutationState(options)`      | `<mutation-state/states options=() => options/>`    |
| `<HydrationBoundary state>`      | `<hydration-boundary state=state>`                  |
| `QueryClientProvider`            | `<query-client-factory factory=createQueryClient/>` |
| `useQueryClient()`               | `getQueryClient($global)`                           |
| `queryClient` argument of a hook | `client=() => queryClient` input of a tag           |
| Hook return value                | Tag variable                                        |

## Tag Variables

A tag returns its result through a tag variable. The name after the slash is the variable:

```marko
<query/todos options=() => ({ queryKey: ["todos"], queryFn: fetchTodos })/>

<p>${todos.status}</p>
<button onClick() { todos.refetch() }>Refetch</button>
```

The template reads `todos` like any other value. When the result changes, Marko updates the parts of the template that read it.

## Why Inputs Are Functions

These inputs are functions that return the value:

- `options` of `<query>`, `<queries>`, `<infinite-query>`, `<mutation>`, `<mutation-state>`, and `<hydration-boundary>`
- `filters` of `<is-fetching>` and `<is-mutating>`
- `client` of every tag except `<query-client-factory>`

There are two reasons.

**Serialization.** The tags read their input again in the browser, so Marko must send that input to the browser. Marko can send a function that a template defines. It cannot send an object that holds functions, such as query options with a `queryFn`. So write `options=() => todosQuery`, not `options=todosQuery`. This also applies to options that you import from a module:

```marko
import { todosQuery } from "../lib/queries";

<query/todos options=() => todosQuery/>
```

**Reactivity.** The tag calls the function again when the values that it reads change. Then the tag gives the new options to its observer. For example, when `page` changes, `<query>` moves to the query for the new page:

```marko
<let/page=1>
<query/projects options=() => ({
  queryKey: ["projects", page],
  queryFn: () => fetchProjects(page),
})/>

<button onClick() { page++ }>Next page</button>
```

## Results

The tag variable holds the observer result without its functions, plus the methods of the tag:

| Tag                | Methods                                         |
| ------------------ | ----------------------------------------------- |
| `<query>`          | `refetch`                                       |
| `<infinite-query>` | `refetch`, `fetchNextPage`, `fetchPreviousPage` |
| `<queries>`        | `refetch` on each result                        |
| `<mutation>`       | `mutate`, `mutateAsync`, `reset`                |

The other functions are removed so that Marko can serialize the result for the browser.

## Server and Browser

A tag does different work on the server and in the browser:

- On the server, a query tag reads the cache of the request's client and renders the current state. It does not fetch and does not subscribe. To render data on the server, prefetch it. See [Server Rendering & Hydration](./ssr.md).
- In the browser, the tag subscribes when it mounts. It updates its tag variable when the result changes, and unsubscribes when it is removed.

## Errors

By default, errors are in the result: check `isError` and read `error`. To handle errors with a `<try>` tag instead, set `throwOnError`. The tag then throws the error during render, and the nearest `<@catch>` renders it:

```marko
<try>
  <query/todos options=() => ({
    queryKey: ["todos"],
    queryFn: fetchTodos,
    throwOnError: true,
  })/>
  <ul>
    <for|todo| of=todos.data ?? [] by="id">
      <li>${todo.title}</li>
    </for>
  </ul>
  <@catch|error|>
    <p>Error: ${(error as Error).message}</p>
  </@catch>
</try>
```

`<query>`, `<queries>`, `<infinite-query>`, and `<mutation>` support `throwOnError`. The throw also happens when the error itself is `undefined`, so a `queryFn` that calls `Promise.reject()` reaches `<@catch>`.

## No Provider

Marko has no context API, so Marko Query does not use a provider component. It creates one client per request on the server and one client per page in the browser. See [The Query Client](./query-client.md).
