# TanStack Solid Query Chat Example

A chat UI that streams the answer into the query cache with `streamedQuery`.

## How it works

- `src/services/messages/queries.ts` defines `messagesQueries.detail(id, question)` with `queryOptions`. Its `queryFn` is `streamedQuery` (imported as `experimental_streamedQuery`), which appends each chunk from `streamFn` to `data` as it arrives, and `staleTime: Infinity` keeps a finished answer from being refetched.
- `src/services/messages/api.ts` returns an async iterable that yields a canned answer word by word with random delays and stops when the query's `signal` is aborted.
- `src/index.tsx` renders a `ChatMessage` per question, which reads the streamed words from `useQuery` and joins them. `isFetching` stays `true` until the stream ends, which shows the "..." indicator.

To run this example:

- `npm install`
- `npm run dev`
