---
id: query-client
title: The Query Client
---

Every tag reads and writes the cache of a `QueryClient`. Marko 6 has no context API, so Marko Query manages the clients for you:

- **On the server**, there is one client per request. Marko Query stores it on the `$global` of the render and creates it the first time something asks for it: a route handler that prefetches, or the first tag that renders. Requests never share a client, so the data of one user never reaches another user.
- **In the browser**, there is one client per page. Marko Query creates it the first time something asks for it and mounts it once, so it refetches on window focus and on reconnect.

You configure these clients with a factory, and you read them with `getQueryClient`.

## Configuring the Clients

Write a function that returns a new `QueryClient`, then register it once, in the root layout, with `<query-client-factory>`:

```ts
// src/lib/query-client.ts
import { QueryClient } from '@tanstack/marko-query'

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
      },
    },
  })
```

```marko
// src/routes/+layout.marko
import { createQueryClient } from "../lib/query-client";

<!doctype html>
<html lang="en">
  <body>
    <query-client-factory factory=createQueryClient/>
    <${input.content}/>
  </body>
</html>
```

Marko Query calls the factory for every client that it creates. So the factory must return a new `QueryClient` on each call. If it returns a shared instance, all requests on the server share one cache.

The tag registers the factory in both environments:

- On the server, it registers the factory when the module of the layout is evaluated. Loading a route loads the layout with it, so the registration runs before any handler, middleware, or render of the first request. A route handler that prefetches already gets a client from the factory.
- In the browser, it registers the factory when the tag mounts.

The tag has these rules:

- `factory` must be a function that the template imports, as in `factory=createQueryClient`. An inline function is a compile error, because the server registers the factory outside of any render.
- A template can contain the tag once. Put it once, in the root layout.
- The tag must render before the content that uses the client. If a client already exists when the tag registers the factory, the tag throws an error.

If you do not register a factory, Marko Query uses `() => new QueryClient()`. In development, the server then logs a warning once, because a missing factory usually means that the registration did not run. To use the default options on purpose, register `() => new QueryClient()` yourself.

### Without Marko Run

The server registration runs when the module of the layout is evaluated. A custom server that loads the route or template modules before it fetches data needs nothing extra: loading a route loads the layout with it, so the factory is registered before the first prefetch.

The escape hatch is for a server that fetches data without loading the templates first. Call `setQueryClientFactory` in a module that the server entry imports, and keep `<query-client-factory>` in the layout for the browser factory registration:

```ts
// server entry
import { setQueryClientFactory } from '@tanstack/marko-query'
import { createQueryClient } from './lib/query-client'

setQueryClientFactory(createQueryClient)
```

If the server fetches before the layout module is evaluated, the client is created with the default factory. In development, the server logs a warning that names the fix.

## Getting the Client

`getQueryClient($global)` returns the client of the current render. Use it in templates, for example in an event handler or in a mutation callback:

```marko
import { getQueryClient } from "@tanstack/marko-query";

<button onClick() {
  getQueryClient($global).invalidateQueries({ queryKey: ["todos"] });
}>
  Refresh todos
</button>
```

In Marko Run, the context of a route handler or middleware is the `$global` of the render. So pass the context:

```ts
// src/routes/todos/+handler.ts
import { getQueryClient, noop } from '@tanstack/marko-query'
import { todosQuery } from '../../lib/queries'

export const GET = Run.GET(async (context, next) => {
  await getQueryClient(context).query(todosQuery).catch(noop)
  return next()
})
```

The `$global` argument works differently in each environment:

- On the server, `$global` is required, because each request has its own client. Without it, `getQueryClient` throws an error.
- In the browser, `$global` is optional. All calls return the same client, the client of the page. `$global` controls only hydration:
  - **With `$global`**, `getQueryClient($global)` reads the state that the server serialized into `$global.dehydratedQueryState` (the cache that the server prefetched) and hydrates the client with it.
  - **Without `$global`**, `getQueryClient()` does not read or hydrate anything. If no call with `$global` has run yet, the cache has no server data.
  - **Hydration runs once for each state.** The first call with `$global` hydrates the client. Later calls with the same `$global` find that the state is already hydrated, so they change nothing in the cache.
  - **After the first call with `$global`**, you can call `getQueryClient()` without it. The client is already hydrated and is the same client.

The query tags always pass `$global` to `getQueryClient`, so they hydrate the client for you. Pass `$global` yourself when your own code reads the client before any query tag has run:

```marko
// src/tags/todo-count/index.marko
import { getQueryClient } from "@tanstack/marko-query";

// Pass $global the first time, so the client has the server data.
<const/client=getQueryClient($global)>

<p>${client.getQueryData(["todos"])?.length ?? 0} todos</p>
```

In code that runs later, for example an event handler, `getQueryClient()` without `$global` returns this same, already hydrated client.

## Using Your Own Client

The factory covers most needs. To use a client that you created yourself, call `setQueryClient`:

- On the server, `setQueryClient(client, $global)` makes `client` the client of the request. `$global` is required. Call it before anything else gets the client of that request.
- In the browser, `setQueryClient(client)` replaces the client of the page. Marko Query mounts the new client and unmounts the previous one. When you also pass `$global`, Marko Query hydrates the new client with the state that the server put on `$global`, unless it already hydrated that state into a client. Marko Query hydrates each state once, so it does not hydrate it again into the new client.

## A Different Client for One Tag

Every tag except `<query-client-factory>` takes a `client` input. It is a function that returns the client to use instead of the client for this `$global`:

```marko
import { widgetClient } from "../lib/widget-client";

<query/stats
  client=() => widgetClient
  options=() => ({ queryKey: ["stats"], queryFn: fetchStats })
/>
```

A client that you create at module scope is shared by all requests on the server. Do not put data that is specific to a user in it.

## Restoring a Persisted Cache

While a persister restores the cache, queries must not fetch, or they fetch data that the restore is about to give them. Marko Query guards this case with `setIsRestoring` and `isRestoring`:

- `setIsRestoring(client, true)` marks the cache of `client` as being restored. While it is `true`, the query tags of that client do not subscribe, so they do not fetch. Their result has `fetchStatus: 'idle'`.
- `setIsRestoring(client, false)` ends the restore. The tags then subscribe and fetch as usual.
- `isRestoring(client)` returns the current value.
