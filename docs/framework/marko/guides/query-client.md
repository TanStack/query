---
id: query-client
title: The Query Client
---

Every tag reads and writes the cache of a `QueryClient`. Marko has no context API, so Marko Query manages the clients for you:

- **On the server**, there is one client per request. Marko Query stores it on the `$global` of the render and creates it the first time something asks for it: a route handler that prefetches, or the first tag that renders. Requests never share a client, so the data of one user never reaches another user.
- **In the browser**, there is one client per page. Marko Query creates it the first time something asks for it and mounts it once, so it refetches on window focus and on reconnect.

You configure these clients with a factory, and you read them with `getQueryClient`. [Summary: Factories, Clients, and Scope](#summary-factories-clients-and-scope) puts every call and its scope in one place.

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

The tag registers the factory in both environments, when the module of the layout is evaluated:

- On the server, loading a route loads the layout with it, so the registration runs before any handler, middleware, or render of the first request. A route handler that prefetches already gets a client from the factory.
- In the browser, the module of the layout is part of the page bundle, and the bundle is evaluated before Marko mounts anything. So the registration runs before the first query tag asks for the client of the page.

The order does not depend on where the tag renders. It is fixed by module evaluation, so the tag works in the root layout even though Marko mounts child templates before their parents.

The tag has these rules:

- `factory` must be a function that the template imports, as in `factory=createQueryClient`. An inline function is a compile error, because the registration runs outside of any render.
- A template can contain the tag once. Put it once, in the root layout.
- On the server, the tag throws an error if a client already exists when it registers the factory. Two clients in one request would hold two different caches.
- In the browser, the tag does not throw. If the page already has a client, the tag logs a warning in development and the factory applies to every client that Marko Query creates after it. The client of the page stays as it is, because a new client would lose the data that the page already has.

The factory is stored once per process, so every root that one server process renders must use the same factory. Two layouts with different factories do not coexist: the layout module evaluated last wins, and every later request uses its factory, including requests for the other root. The browser is not affected, because each page bundle contains the layout of its own root.

A server that must give one root different client options pins a client for the request instead of registering a second factory. Call `setQueryClient(client, $global)` in that root's middleware, before anything reads the client:

```ts
// src/routes/admin/+middleware.ts
import { QueryClient, setQueryClient } from '@tanstack/marko-query'

export default Run.ALL(async (ctx, next) => {
  setQueryClient(new QueryClient({ defaultOptions: adminDefaults }), ctx)
  return next()
})
```

The pin belongs to that request only. Other requests keep the process factory, and a factory that registers later does not replace a client that already exists. The browser client of that root still comes from the factory in its layout, so keep the two in step: the pin covers the server, the layout covers the browser.

If you do not register a factory, Marko Query uses `() => new QueryClient()`. In development, the server then logs a warning once, because a missing factory usually means that the registration did not run. To use the default options on purpose, register `() => new QueryClient()` yourself.

### Without Marko Run

The server registration runs when the module of the layout is evaluated. A custom server that loads the route or template modules before it fetches data needs nothing extra: loading a route loads the layout with it, so the factory is registered before the first prefetch.

The escape hatch is for a server that fetches data without loading the templates first. Call `setQueryClientFactory` in a module that the server entry imports, and keep `<query-client-factory>` in the layout, which registers the factory in the browser:

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
  - **Hydration runs once for each state, for each client.** The first call with `$global` hydrates the client. Later calls with the same `$global` find that the state is already hydrated into that client, so they change nothing in the cache. A client that replaces the page's client receives the same state, because the record of hydrated states belongs to the client. A paused mutation is also added only once when the same mutation reaches the client through `<hydration-boundary>` as well.
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
- In the browser, `setQueryClient(client)` replaces the client of the page. Marko Query mounts the new client and unmounts the previous one. When you also pass `$global`, Marko Query hydrates the new client with the state that the server put on `$global`. Marko Query hydrates each state once for each client, so a state that the previous client already hydrated still reaches the new client, and a second call for the same client changes nothing.

Replacing the client of the page is not a one-way door. Every mounted tag that follows the client of the page reconnects to the new one, so its result and its subscription move with it. A tag that you gave its own `client` input keeps observing that client. The reconnect happens in the same tick as the call, so a tag never observes the old client after `setQueryClient` returns.

The new client is not seeded with the data of the old one. A `<query>` that resumed from the server keeps its server snapshot for the render that made it, and the binding that Marko Query rebuilds for the replacement client does not replay that snapshot. The tag then shows what the new client holds, not the entries of the previous cache. What the new client holds depends on how you replace it:

- `setQueryClient(client)` with no `$global` leaves the new client empty, so the tag fetches for itself.
- `setQueryClient(client, $global)` hydrates the state that the server put on `$global` into the new client, so the tag shows the server's data.
- A client that you filled yourself, for example with `setQueryData`, keeps its own entries.

This matters when the replacement is a different scope, such as another account or another tenant, and the query has a long `staleTime`.

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

Marko Query mounts this client while a tag uses it, and unmounts it when the last tag that used it is destroyed. `mount` is what makes the client listen for focus and reconnection, so without it the client's queries would never refetch on either, and a mutation that paused while offline would never resume. The client of the page is mounted already, so a tag leaves that one alone.

## Summary: Factories, Clients, and Scope

Two things are separate. A **factory** is a function that returns a new `QueryClient`. A **client** is one cache with its own listeners. You register one factory; Marko Query creates clients from it.

### Server: one factory, one client per request

| Call                                                | Effect                                                                                                            | Scope       |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ----------- |
| `<query-client-factory factory=createQueryClient/>` | Registers the factory when the layout module is evaluated.                                                        | Process     |
| `setQueryClientFactory(createQueryClient)`          | Registers the same factory from a server entry that does not load templates first.                                | Process     |
| `getQueryClient($global)`                           | Creates the request's client from the factory on the first call, then returns that client.                        | One request |
| `setQueryClient(client, $global)`                   | Makes `client` the request's client. It replaces a client that `getQueryClient` already created for that request. | One request |

The factory runs once per request, not once per tag: every tag in a request reads the same client from `$global`.

`setQueryClient` replaces the client for reads that happen after it. A tag that already rendered read the earlier client, so call it before the first tag renders.

### Browser: one client per page

| Call                                               | Effect                                                                                                                                                         | Scope       |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `<query-client-factory>` / `setQueryClientFactory` | Registers the factory. A factory that arrives after the page's client exists applies only to clients created later.                                            | Page bundle |
| `getQueryClient($global)`                          | Creates the page's client on the first call, mounts it, and hydrates it from `$global` once for each state.                                                    | One page    |
| `setQueryClient(client, $global)`                  | Replaces the page's client, mounts it, unmounts the previous one, hydrates `$global` into it, and reconnects every mounted tag that follows the page's client. | One page    |

Every tag without a `client` input uses the page's client. A page has one client however many tags it renders.

### Per tag: `client=() => myClient`

`client` overrides the page's client for that tag only. The tag mounts the client while it uses it and unmounts it when the last tag using it is destroyed, so focus and reconnect refetches work on it.

| Situation                         | Result                                                                                  |
| --------------------------------- | --------------------------------------------------------------------------------------- |
| Several tags name the same client | One cache, one mount. The client is unmounted when the last of those tags is destroyed. |
| A tag names the page's client     | Safe. The page's client stays mounted while the page lives.                             |
| A tag names a module-scope client | Every tag that names it shares that one cache. See below.                               |

#### Never put per-request data in a module-scope client

A module-scope client is one object for the whole server process. Every request that names it reads and writes the same cache, so data from one user is visible to the next.

```ts
// src/lib/widget-client.ts
import { QueryClient } from '@tanstack/marko-query'

// One object for the whole process. Do not cache user data in it.
export const widgetClient = new QueryClient()
```

```marko
// Any template that names it.
<query/me client=() => widgetClient options=() => ({ queryKey: ["me"], queryFn: fetchMe })/>
```

Request A fills that cache with `"user-a"`, for example in a handler that calls `widgetClient.query(...)`. Request B renders the tag and finds `"user-a"` in the cache, so it renders request A's data.

Request B's handler calling `widgetClient.query(...)` does not help. While A's entry is fresh, B's call makes no API request and returns A's data.

The rule is absolute: a module-scope client may hold only data that every user may see, such as a public config or a shared lookup table. For anything that depends on the user, use the factory, which makes a new client for each request.

The pattern is still useful for that shared data. The tag dehydrates the cache of the client it uses, so the server's copy of a module-scope client reaches the browser through the tag's own hydration, and the page does not refetch that data while it is fresh.

### Choosing

| You want                                         | Use                                                    |
| ------------------------------------------------ | ------------------------------------------------------ |
| One cache per request, and per page              | The factory, and no `client` input.                    |
| Different options for one route on the server    | `setQueryClient` in that route's middleware.           |
| A separate cache for one widget                  | A module-scope client and `client=() => widgetClient`. |
| A different client for the whole page at runtime | `setQueryClient(client)` in the browser.               |

## Restoring a Persisted Cache

While a persister restores the cache, queries must not fetch, or they fetch data that the restore is about to give them. Marko Query guards this case with `setIsRestoring` and `isRestoring`:

- `setIsRestoring(client, true)` marks the cache of `client` as being restored. While it is `true`, the query tags of that client do not subscribe, so they do not fetch. Their result has `fetchStatus: 'idle'`.
- `setIsRestoring(client, false)` ends the restore. The tags then subscribe and fetch as usual.
- `isRestoring(client)` returns the current value.
