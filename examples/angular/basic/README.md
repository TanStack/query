# TanStack Angular Query Basic Example

A list of posts and a post detail view. Posts you have already opened are marked as visited from the query cache.

## How it works

- `src/app/services/posts/api.ts` is an `@Injectable` `PostsAPI` that returns `HttpClient` observables for the post list and a single post.
- `src/app/services/posts/queries.ts` is an `@Injectable` `PostsQueries` whose `list()` and `detail(id)` return `queryOptions` and turn the observables into promises with `lastValueFrom`. The detail request is stopped with `takeUntil` when the query's `signal` aborts.
- `src/app/components/posts.component.ts` reads the list with `injectQuery(() => this.postsQueries.list())`, and `src/app/components/posts.component.html` shows a post in bold green when `queryClient.getQueryData(postsQueries.detail(post.id).queryKey)` returns data.
- `src/app/components/post.component.ts` passes the `postId` input signal to `injectQuery(() => this.#postsQueries.detail(this.postId()))`, so the query follows the selected post and shows "Background Updating..." while `isFetching()` is `true`.
- `src/app/app.config.ts` registers the `QueryClient` with `provideTanStackQuery` and a default `gcTime` of 24 hours, plus `withDevtools()`.

To run this example:

- `npm install`
- `npm start`
