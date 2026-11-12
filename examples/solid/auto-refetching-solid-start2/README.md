# TanStack Solid Query Auto Refetching Example (SolidStart)

A todo list that polls the server with `refetchInterval`. Adding a todo or clearing the list invalidates the query.

Built with [SolidStart](https://start.solidjs.com).

## How it works

- `src/services/todos/queries.ts` defines `todosQueries.list()` with `queryOptions`, keyed by `['todos', 'list']`, and `todosMutations.create()` and `todosMutations.deleteAll()` with `mutationOptions`.
- `src/services/todos/api.ts` keeps the list in server memory. Each function is a SolidStart server function marked with `'use server'`.
- `src/routes/index.tsx` passes the list options to `useQuery` with `refetchInterval` bound to a signal, so changing the interval input changes how often the query refetches. Both mutations call `queryClient.invalidateQueries({ queryKey: todosQueries.all() })` in `onSuccess`.
- `src/app.tsx` creates the `QueryClient` and provides it with `QueryClientProvider` around the SolidStart router.

To run this example:

- `npm install`
- `npm run dev`
