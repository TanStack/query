# TanStack React Query Auto Refetching Example (Next.js Pages Router)

A todo list that polls the server with `refetchInterval`. Adding a todo or clearing the list invalidates the query.

Built with [Next.js (Pages Router)](https://nextjs.org/docs/pages).

## How it works

- `src/services/todos/queries.ts` defines `todosQueries.list()` with `queryOptions`, and `todosMutations.create()` and `todosMutations.deleteAll()` with `mutationOptions`.
- `src/pages/index.tsx` passes `todosQueries.list()` to `useQuery` with `refetchInterval: intervalMs`. The interval can be changed in a number input, and a dot lights up while `isFetching` is `true`.
- In `src/pages/index.tsx`, both mutations run through `useMutation` and call `queryClient.invalidateQueries({ queryKey: todosQueries.all() })` in `onSuccess`, so the list refetches after adding a todo or clearing the list.
- `src/pages/api/data.ts` is a Next.js API route that keeps the list in memory, adds an item with `?add=`, empties it with `?clear=1`, and responds after a 100 ms delay.

To run this example:

- `npm install`
- `npm run dev`
