---
id: ssr
title: Server Rendering & Hydration
---

Marko renders pages on the server and then resumes them in the browser. Marko Query is built for this model. Data that you fetch on the server is rendered into the HTML and sent with the page, so the browser starts with the same cache and does not fetch that data again while it is fresh.

Read [The Query Client](./query-client.md) first. This guide depends on how Marko Query creates one client per request.

## Why Hydration

Without hydration, the server can only render a loading state. The browser loads the page, then the JavaScript, then starts the fetch: the user waits for a request waterfall.

With hydration, the server fetches the data and renders it. Then it serializes the cache into the page ("dehydration"). The browser loads that state into its own cache ("hydration") before the tags read it, so the first result in the browser already has the data.

## Marko Query's Hydration Model

For the common case, there is no `dehydrate` or `hydrate` in your application code. Marko Query does both steps:

1. **On the server**, each request has its own client, stored on the `$global` of the render. Query tags never fetch on the server. During the server render, a query tag only reads the data that is already in the cache of this client, then renders it. It does not subscribe to changes. If the cache has no data for the query, the tag renders its pending state, and the server sends that state to the browser.

   To send a page that contains the data, fill the cache before the tag renders. Call `query` (or `infiniteQuery`) on the client of the request in a route handler, a middleware, or the page, and ignore the result. See [Ways to Load Data on the Server](#ways-to-load-data-on-the-server).

2. **On the wire**, Marko Query sends the cache state to the browser in two ways:
   - The whole cache of the request client, as `$global.dehydratedQueryState`. Marko Query adds this key to `serializedGlobals`, so Marko serializes it. Marko Query dehydrates the client at the last moment, when Marko writes `$global` into the page that it sends to the browser, not when the client is created. So the state includes everything that your handlers, middleware, and page fetched before that moment.
   - The cache entries that each query tag rendered. Each `<query>`, `<queries>`, and `<infinite-query>` tag dehydrates only its own entries (the cache entries with the same query hash as the tag, which is the query key in a stable string form). Marko sends them with the tag.
3. **In the browser**, the state is hydrated before it is read. `getQueryClient($global)` hydrates the client of the page with the state in `$global`, once for each state. Each query tag hydrates its own entries before it subscribes.

The second way exists because Marko writes `$global` once, in the first part of the response that contains data for the browser. Data that is fetched after that, for example inside `<await>`, is not in `$global`. It reaches the browser with the tags that render it.

| Scenario                                                                | Reaches the browser through                |
| ----------------------------------------------------------------------- | ------------------------------------------ |
| The cache is filled before the page renders, for example by a handler   | `$global`, and the query tags that read it |
| The data loads after `$global` is written, for example inside `<await>` | The query tag only                         |

Hydration uses `hydrate` from TanStack Query Core, which updates a query entry only when the incoming data is newer. So when a query arrives in both ways, the second copy changes nothing. Mutations are different: core `hydrate` always adds a new `Mutation`, so Marko Query filters the paused mutations that the client already has before it calls `hydrate`. A paused mutation is therefore added once, and it runs once when the connection returns.

### What Is Sent

Marko Query uses the `dehydrate` defaults of the client:

- Only successful queries are sent. A query that failed on the server is fetched again in the browser.
- The data must be serializable by Marko. To transform it, set `defaultOptions.dehydrate.serializeData` and `defaultOptions.hydrate.deserializeData` in your factory.
- To change which queries are sent, set `defaultOptions.dehydrate.shouldDehydrateQuery` in your factory.

### Set a `staleTime`

The hydrated data keeps the time at which the server fetched it. With the default `staleTime` of `0`, that data is stale as soon as it arrives, so the query tag refetches it when it mounts in the browser. To avoid this refetch, set a `staleTime` above `0` in your factory:

```ts
// src/lib/query-client.ts
import { QueryClient } from '@tanstack/marko-query'

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 60 * 1000,
      },
    },
  })
```

## Ways to Load Data on the Server

Marko Query supports these ways to get data into the server render. You can use more than one in the same app.

### Prefetching in a Route Handler

Fetch the data before the page renders. In Marko Run, do it in the `+handler` or `+middleware` file of the route. The context of the handler is the `$global` of the render, so the handler and the page use the same client:

```ts
// src/lib/queries.ts
import { queryOptions } from '@tanstack/marko-query'
import { getTodos } from './api'

export const todosQuery = queryOptions({
  queryKey: ['todos'],
  queryFn: getTodos,
})
```

```ts
// src/routes/todos/+handler.ts
import { getQueryClient, noop } from '@tanstack/marko-query'
import { todosQuery } from '../../lib/queries'

export const GET = Run.GET(async (context, next) => {
  await getQueryClient(context).query(todosQuery).catch(noop)
  return next()
})
```

```marko
// src/routes/todos/+page.marko
import { todosQuery } from "../../lib/queries";

<query/todos options=() => todosQuery/>

<if=todos.data>
  <ul>
    <for|todo| of=todos.data by="id">
      <li>${todo.title}</li>
    </for>
  </ul>
</if>
<else-if=todos.error>
  <p>Error: ${todos.error.message}</p>
</else-if>
```

`query` rejects when the fetch fails. With `.catch(noop)`, the page still renders. The failed query is not sent, so the browser fetches it again. For an infinite query, use `infiniteQuery` instead of `query`. To prefetch several queries in parallel, use `Promise.all`.

Pros:

- The HTML contains the data, and the browser does not fetch it again while it is fresh.
- Any template of the page can read the data, without passing it through `input`.

Cons:

- The response starts only after the slowest prefetch finishes.
- The query functions run on the server, so they must work there. For example, `fetch` on the server needs an absolute URL.

### Streaming with `<await>`

To send the page before the data is ready, start the fetch during render and render the query inside `<await>`. Marko streams the rest of the page first, with the `<@placeholder>` content. When the promise resolves, Marko streams the content of `<await>`:

```marko
// src/routes/report/+page.marko
import { getQueryClient } from "@tanstack/marko-query";
import { reportQuery } from "../../lib/queries";

<const/ready=getQueryClient($global).query(reportQuery)>

<h1>Report</h1>

<try>
  <@placeholder>
    <p>Loading...</p>
  </@placeholder>
  <@catch|error|>
    <p>Error: ${(error as Error).message}</p>
  </@catch>
  <await|_|=ready>
    <query/report options=() => reportQuery/>
    <p>${report.data?.summary}</p>
  </await>
</try>
```

The `<query>` tag inside `<await>` renders after the cache has the data, and Marko sends the cache entry of that tag with the streamed content. So the browser does not fetch it again while it is fresh. If `query` rejects, `<@catch>` renders the error.

Pros:

- The browser receives the rest of the page without waiting for the slow query.

Cons:

- Only the content inside `<await>` waits for the data. A query tag outside of it renders before the data exists, so it renders the pending state.

### Hydrating Other State with `<hydration-boundary>`

`<hydration-boundary>` hydrates a dehydrated state that does not come from the client of the request, for example the output of `dehydrate` from another client or another service. It hydrates the client for this `$global`, then renders its content, so the tags inside it read the hydrated data:

```marko
// src/tags/user-card/index.marko
import type { DehydratedState } from "@tanstack/marko-query";
import { userQuery } from "../../lib/queries";

export interface Input {
  state: DehydratedState;
}

<hydration-boundary state=input.state>
  <query/user options=() => userQuery/>
  <p>${user.data?.name}</p>
</hydration-boundary>
```

Use the boundary only for state that the request client does not already have. Data that you prefetch with `getQueryClient($global)`, or that a query tag loads inside `<await>`, reaches the browser without a boundary.

The boundary hydrates during the server render, and again when it mounts in the browser. When a later render gives it a new state, it hydrates that state too. A paused mutation is added to the cache only once, even when the same state also arrives through `$global` or is passed again on a later render. It takes these inputs:

- `state`: what `dehydrate` returned. `null` and `undefined` are ignored.
- `options`: a function that returns the `HydrateOptions` for core `hydrate`, for example `options=() => ({ defaultOptions: { queries: { staleTime: 60 * 1000 } } })`.
- `client`: a function that returns the client to hydrate instead of the client for this `$global`.

On the server, the boundary hydrates the client of the request. So its state also reaches the browser in the two ways that are described above: in `$global`, and with the query tags that read it. In the browser, the boundary hydrates the client of the page, or the client that you pass in `client`.

To hydrate a client other than the client of the page, pass it in `client`. The tags inside the boundary must use the same client, so pass the same `client` to them.

Resolve that client inside the template, from a module or from `$global`. Never pass a `QueryClient` as a tag input: when a tag resumes in the browser, Marko serializes its input, and a `QueryClient` is not serializable, so the render fails with `TypeError: Unable to serialize "input.client"`.

```ts
// src/lib/report-client.ts
import { QueryClient } from '@tanstack/marko-query'

const KEY = Symbol.for('report-client')

/** One client per request on the server, one per page in the browser. */
export function getReportClient($global: object): QueryClient {
  const scope = $global as Record<symbol, QueryClient | undefined>
  return (scope[KEY] ??= new QueryClient())
}
```

The parameter is `object`, like `getQueryClient`, so a Marko Run handler context and a template's `$global` both fit.

```marko
// src/tags/report-card/index.marko
import type { DehydratedState } from "@tanstack/marko-query";
import { reportQuery } from "../../lib/queries";
import { getReportClient } from "../../lib/report-client";

export interface Input {
  state: DehydratedState;
}

<hydration-boundary state=input.state client=() => getReportClient($global)>
  <query/report options=() => reportQuery client=() => getReportClient($global)/>
  <p>${report.data?.summary}</p>
</hydration-boundary>
```

The handler that prefetches for this card calls `getReportClient(context)` too, so the render and the handler use the same client.

### Not Prefetching

When nothing fills the cache on the server, the query tags render their pending state on the server, and the browser fetches the data after the page loads. This is a good fit for data that the first HTML does not need.

## Custom Servers

Marko Run creates the `$global` of each request for you. A custom server, for example one that renders templates with `@marko/vite`, does the same work itself:

1. Create a new `$global` object for each request. Never reuse it for another request.
2. Prefetch with `getQueryClient($global)`.
3. Render the template with the same `$global`.

The server must load the template through the Marko compiler, for example with `ssrLoadModule` of Vite:

```js
import { getQueryClient, noop } from '@tanstack/marko-query'
import { todosQuery } from './lib/queries'
import template from './pages/todos.marko'

export async function renderTodos(res) {
  const $global = {}
  await getQueryClient($global).query(todosQuery).catch(noop)
  res.setHeader('content-type', 'text/html; charset=utf-8')
  template.render({ $global }).pipe(res)
}
```

The example loads the template module before it prefetches, so the factory is registered before the first prefetch. If your server fetches data without loading the templates first, register the factory yourself. See [Without Marko Run](./query-client.md#without-marko-run).
