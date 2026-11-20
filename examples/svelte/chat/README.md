# TanStack Svelte Query Chat Example

A chat UI that streams the answer into the query cache with `streamedQuery`.

## How it works

- `src/lib/services/messages/queries.ts` defines `messagesQueries.detail(id, question)` with `queryOptions`. Its `queryFn` is `streamedQuery` (imported as `experimental_streamedQuery`), which appends each chunk from `streamFn` to `data` as it arrives, and `staleTime: Infinity` keeps a finished answer from being refetched.
- `src/lib/services/messages/api.ts` returns an async iterable that yields a canned answer word by word with random delays and stops when the query's `signal` is aborted.
- `src/lib/Example.svelte` keeps the list of questions and renders a `ChatMessage` for each one.
- `src/lib/ChatMessage.svelte` reads the streamed words from `createQuery` and joins them. `isFetching` stays `true` until the stream ends, which shows the "..." indicator.

To run this example:

- `npm install`
- `npm run dev`
