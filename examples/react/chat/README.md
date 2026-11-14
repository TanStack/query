# TanStack React Query Chat Example

A chat UI that streams the answer into the query cache with `streamedQuery`.

## How it works

- `src/services/messages/queries.ts` defines `messagesQueries.detail(id, question)` with `queryOptions`, using `experimental_streamedQuery` (imported as `streamedQuery`) as the `queryFn` and `staleTime: Infinity`.
- `src/services/messages/api.ts` returns an async iterable that yields a canned answer word by word with random delays and stops when the query's `signal` is aborted.
- `src/index.tsx` renders a `ChatMessage` per question, which calls `useQuery(messagesQueries.detail(id, question))`. `data` is the array of chunks received so far, joined into the answer, and `isFetching` stays `true` until the stream ends.

To run this example:

- `npm install`
- `npm run dev`
