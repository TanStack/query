# TanStack Angular Query Auto Refetching Example

A todo list that polls the server with `refetchInterval`. Adding a todo or clearing the list invalidates the query.

## How it works

- `src/app/services/tasks/queries.ts` has two `@Injectable` classes: `TasksQueries`, whose `list()` returns `queryOptions`, and `TasksMutations`, whose `create()` and `deleteAll()` return `mutationOptions`. Both convert the `HttpClient` calls from `src/app/services/tasks/api.ts` with `lastValueFrom`.
- `src/app/components/auto-refetching.component.ts` spreads `list()` into `injectQuery` with `refetchInterval: this.intervalMs()`, so changing the `intervalMs` signal from the input changes the polling rate. The template lights a dot while `isFetching()` is `true`.
- In `src/app/components/auto-refetching.component.ts`, `addMutation` and `clearMutation` are created with `injectMutation`, and both invalidate the list's `queryKey` on success.
- `src/app/interceptor/tasks-mock.interceptor.ts` is an `HttpInterceptorFn`, registered with `withInterceptors` in `src/app/app.config.ts`, that answers `/api/tasks` from `localStorage` after 100 ms for `GET`, `POST` and `DELETE`.

To run this example:

- `npm install`
- `npm start`
