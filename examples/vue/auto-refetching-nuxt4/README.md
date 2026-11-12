# TanStack Vue Query Auto Refetching Example

A todo list that polls the server with `refetchInterval`. Adding a todo or clearing the list invalidates the query.

Built with [Nuxt 4](https://nuxt.com).

## How it works

- `app/services/todos/queries.ts` defines `todosQueries.list()` with `queryOptions`, and `todosMutations.create()` and `todosMutations.deleteAll()` with `mutationOptions`. `app/services/todos/api.ts` calls the server with `$fetch`.
- `app/app.vue` passes a getter to `useQuery` that adds `refetchInterval: intervalMs.value`, so changing the interval input changes the polling rate. A dot next to the input lights up while `isFetching` is `true`.
- In `app/app.vue`, adding a todo and clearing the list use `useMutation`, and both invalidate `todosQueries.all()` on success.
- `app/plugins/vue-query.ts` is a Nuxt plugin that creates a `QueryClient` and installs `VueQueryPlugin`. On the server it stores `dehydrate(queryClient)` in `useState('vue-query')` on `app:rendered`, and on the client it calls `hydrate` with that state on `app:created`.
- `server/api/data.ts` is a Nitro handler that keeps the list in memory, adds an item for `?add=` or clears it for `?clear=`, and responds after 100 ms.

To run this example:

- `npm install`
- `npm run dev`
