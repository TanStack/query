# TanStack Preact Query SSR Example

Server-side rendering: the server prefetches queries, dehydrates the cache into the page, and the client hydrates it.

## How it works

- `src/services/posts/queries.ts`, `src/services/users/queries.ts`, and `src/services/comments/queries.ts` define `queryOptions` factories for JSONPlaceholder. `usersQueries.detail(id)` uses `skipToken` until the id is known.
- `src/App.tsx` calls `useQuery` for the posts, the first post's author, and the comments. Only the posts and the author are prefetched on the server, so the comments start loading on the client.
- `src/entry-server.tsx` prefetches with `prefetchClient.query(...)`, awaiting the posts and then the author with `.catch(noop)`. It calls `dehydrate`, `hydrate`s a second client for `renderToString`, and serializes the state with `uneval` from `devalue`.
- `src/entry-client.tsx` reads `window.__DEHYDRATED_STATE__`, passes it to `HydrationBoundary`, and calls Preact's `hydrate`. `src/makeQueryClient.ts` sets a 1-minute `staleTime` so the client does not refetch right away.
- `server.js` is an Express server that runs `render()` from `src/entry-server.tsx` and fills the `<!--app-html-->` and `<!--app-state-->` placeholders in `index.html`.

To run this example:

- `npm install`
- `npm run dev`
