# TanStack Lit Query Chat Example

A chat UI that streams the answer into the query cache with `streamedQuery`.

## How it works

- `src/services/messages/queries.ts` defines `messagesQueries.detail(id, question)`, a `queryOptions` factory whose `queryFn` is `experimental_streamedQuery` (imported as `streamedQuery`) with `staleTime: Infinity`.
- `src/services/messages/api.ts` returns an async iterable that yields the answer one word at a time with a random delay and stops when the `signal` aborts.
- `src/chat-message.ts` calls `createQueryController` with `messagesQueries.detail(...)`. `data` grows as chunks arrive and is joined into the answer, and `isFetching` stays `true` until the stream ends.
- `src/main.ts` subclasses `QueryClientProvider` to set the shared `QueryClient` and renders one `<chat-message>` per submitted question.

To run this example:

- `npm install`
- `npm run dev`
