# TanStack Angular Query Basic Example (Angular Router)

The basic posts example with Angular Router, one route per view.

Built with [Angular Router](https://angular.dev/guide/routing).

## How it works

- `src/app/services/posts/api.ts` is an `@Injectable` `PostsAPI` that returns `HttpClient` observables for the post list and a single post.
- `src/app/services/posts/queries.ts` is an `@Injectable({ providedIn: 'root' })` class, `PostsQueries`, whose `list()` and `detail(id)` return `queryOptions` and convert the observables with `lastValueFrom`. Components get it with `inject(PostsQueries)`.
- `src/app/components/posts.component.ts` reads the list with `injectQuery(() => this.postsQueries.list())`, and `src/app/components/posts.component.html` links each post with `routerLink` and shows it in bold green when `queryClient.getQueryData(postsQueries.detail(post.id).queryKey)` returns data.
- `src/app/components/post.component.ts` receives the `postId` route param as an input through `withComponentInputBinding` and passes it to `injectQuery(() => this.#postsQueries.detail(this.postId()))`.
- `src/app/app.routes.ts` lazy loads both components with `loadComponent`, and `src/app/app.config.ts` sets up `provideRouter` and `provideTanStackQuery` with `withDevtools()`.

To run this example:

- `npm install`
- `npm start`
