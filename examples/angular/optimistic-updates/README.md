# TanStack Angular Query Optimistic Updates Example

Adds todos optimistically by writing to the cache in `onMutate` and rolling back on error.

## How it works

- `src/app/services/tasks/queries.ts` has two `@Injectable` classes: `TasksQueries`, whose `list()` returns `queryOptions`, and `TasksMutations`, whose `create()` returns `mutationOptions`. `src/app/services/tasks/api.ts` posts to `/api/tasks-wrong-url` instead when `failMutation` is `true`.
- `src/app/components/optimistic-updates.component.ts` reads the list with `injectQuery` and creates the task with `injectMutation`. `onMutate` cancels the list query, saves the previous list, and appends the new task with `queryClient.setQueryData`.
- In `src/app/components/optimistic-updates.component.ts`, `onError` puts the saved list back, and `onSettled` invalidates the list so it is refetched from the mock server. The "Fail Mutation" checkbox makes the next mutation fail.
- `src/app/interceptor/tasks-mock.interceptor.ts` is an `HttpInterceptorFn`, registered with `withInterceptors` in `src/app/app.config.ts`, that stores tasks in `sessionStorage` and responds after 1 second. Requests to `/api/tasks-wrong-url` get a 500 error.

To run this example:

- `npm install`
- `npm start`
