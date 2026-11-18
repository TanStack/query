# TanStack Vue Query Chat Example

A chat UI that streams the answer into the query cache with `streamedQuery`.

## How it works

- `src/services/messages/api.ts` returns an async iterable that yields a canned answer one word at a time with a random delay, and stops when the `signal` aborts.
- `src/services/messages/queries.ts` defines `messagesQueries.detail(id, question)`, a `queryOptions` factory whose `queryFn` is `experimental_streamedQuery` (imported as `streamedQuery`). Each yielded word is appended to `data`, and `staleTime: Infinity` keeps a finished answer from refetching.
- `src/ChatMessage.vue` passes a getter to `useQuery` for one question and renders `data` joined into a sentence, with `isFetching` marking the answer as still in progress.
- `src/App.vue` adds a question with a new `crypto.randomUUID()` id on submit, so every question gets its own query.

To run this example:

- `npm install`
- `npm run dev`
