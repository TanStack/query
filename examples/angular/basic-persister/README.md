# TanStack Angular Query Basic Persister Example

A list of posts and a post detail view. Posts you have already opened are marked as visited from the query cache. The cache is persisted to `localStorage`.

## How it works

- `src/app/services/posts/queries.ts` is an `@Injectable` `PostsQueries` whose `list()` and `detail(id)` return `queryOptions` and turn the `HttpClient` observables from `src/app/services/posts/api.ts` into promises with `lastValueFrom`.
- `src/app/components/posts.component.ts` reads the list with `injectQuery(() => this.postsQueries.list())`, and `src/app/components/posts.component.html` shows a post in bold green when `queryClient.getQueryData(postsQueries.detail(post.id).queryKey)` returns data.
- `src/app/components/post.component.ts` passes the `postId` input signal to `injectQuery(() => this.#postsQueries.detail(this.postId()))`, so the query follows the selected post.
- `src/app/app.config.ts` adds `withPersistQueryClient` to `provideTanStackQuery` with a `localStorage` persister from `createAsyncStoragePersister`. The `QueryClient` sets a default `staleTime` of 1 minute and a `gcTime` of 24 hours, and the persisted cache is restored when the page reloads.

To run this example:

- `npm install`
- `npm start`
