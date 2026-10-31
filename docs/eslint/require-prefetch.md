---
id: require-prefetch
title: Require queries to be prefetched by the route
---

When a component is the first place a query is used, the query only starts fetching after the component renders. Starting it earlier, in a route loader or a server component, lets the fetch run while the route loads, so the data is in flight (or already cached) by the time the component renders. This pattern is called render-as-you-fetch.

This rule finds the queries used when a route renders and reports those that the route doesn't start before rendering. It supports:

- [TanStack Router](https://tanstack.com/router) and [TanStack Start](https://tanstack.com/start): queries have to be prefetched in the route's `loader` or `beforeLoad`.
- [React Router](https://reactrouter.com) in framework mode and data mode: queries have to be prefetched in the route's `loader` or `clientLoader`, or in the loader of a parent route.
- The [Next.js](https://nextjs.org) App Router and [Waku](https://waku.gg): queries used by client components have to be prefetched by a server component above them, in the page or a layout, and dehydrated into a `<HydrationBoundary>`.

A query counts as prefetched if the same `queryOptions` are passed to `queryClient.query`, `queryClient.infiniteQuery`, or another `QueryClient` method that starts a fetch, including in a helper function that the loader or server component calls. The prefetch does not have to be awaited: a query that is in flight when the component renders is enough.

The rule compares how the query options are built: the same factory, called with arguments that come from the same route params, search params, loader data, route context, props, constants, or module-level values. Query options written inline are compared by their `queryKey`, but are reported when nothing prefetches them, since a `queryOptions()` factory keeps the loader and the component in sync. It follows the components a route renders and the hooks they call, including those imported from other files of the project, and the props passed to them. Queries that depend on values that only exist at render time, like component state, can't be prefetched and are not reported.

## Installation

The rule is part of a separate plugin, since it follows the imports of the file being linted across the project and only supports specific routers and frameworks:

```sh
npm i -D @tanstack/eslint-plugin-query-prefetch
```

or

```sh
pnpm add -D @tanstack/eslint-plugin-query-prefetch
```

or

```sh
yarn add -D @tanstack/eslint-plugin-query-prefetch
```

or

```sh
bun add -D @tanstack/eslint-plugin-query-prefetch
```

Then enable it with the `flat/recommended` config:

```js
import pluginQueryPrefetch from '@tanstack/eslint-plugin-query-prefetch'

export default [
  ...pluginQueryPrefetch.configs['flat/recommended'],
  // Any other config...
]
```

### Parsing imported files

To follow imports, the rule reuses the files ESLint has already linted and parses the others with the parser of the file being linted. If the optional peer dependency [`oxc-parser`](https://www.npmjs.com/package/oxc-parser) is installed, the rule parses them with it instead, which is faster:

```sh
npm i -D oxc-parser
```

`oxc-parser` is also required to use the rule with [Oxlint](https://oxc.rs/docs/guide/usage/linter/js-plugins), since Oxlint's JS plugins don't get a parser they can call. Without it, the rule only checks the components and hooks declared in the file being linted:

```ts
import { defineConfig } from 'oxlint'

export default defineConfig({
  jsPlugins: ['@tanstack/eslint-plugin-query-prefetch'],
  rules: {
    '@tanstack/query-prefetch/require-prefetch': 'error',
  },
})
```

## Rule Details

### TanStack Router

Examples of **incorrect** code for this rule:

```tsx
/* eslint "@tanstack/query-prefetch/require-prefetch": "error" */

export const Route = createFileRoute('/posts/$postId')({
  component: Post,
})

function Post() {
  const { postId } = Route.useParams()
  const { data } = useSuspenseQuery(postQueryOptions(postId))
  // ...
}
```

```tsx
/* eslint "@tanstack/query-prefetch/require-prefetch": "error" */

export const Route = createFileRoute('/posts')({
  loader: ({ context }) => context.queryClient.query(postsQueryOptions(1)),
  component: Posts,
})

function Posts() {
  // The loader doesn't know about `page`, so it prefetches a different query
  const { page } = Route.useSearch()
  const { data } = useSuspenseQuery(postsQueryOptions(page))
  // ...
}
```

```tsx
/* eslint "@tanstack/query-prefetch/require-prefetch": "error" */

export const Route = createFileRoute('/posts/$postId')({
  component: Post,
})

function Post() {
  const { postId } = Route.useParams()
  // Inline options can't be matched with a prefetch in the loader
  const { data } = useSuspenseQuery({
    queryKey: ['posts', postId],
    queryFn: () => fetchPost(postId),
  })
  // ...
}
```

Examples of **correct** code for this rule:

```tsx
/* eslint "@tanstack/query-prefetch/require-prefetch": "error" */

export const Route = createFileRoute('/posts/$postId')({
  loader: ({ params, context }) => {
    // Starting the fetch is enough, it doesn't have to be awaited
    void context.queryClient.query(postQueryOptions(params.postId))
  },
  component: Post,
})

function Post() {
  const { postId } = Route.useParams()
  const { data } = useSuspenseQuery(postQueryOptions(postId))
  // ...
}
```

```tsx
/* eslint "@tanstack/query-prefetch/require-prefetch": "error" */

export const Route = createFileRoute('/posts')({
  loaderDeps: ({ search: { page } }) => ({ page }),
  loader: ({ deps, context }) =>
    context.queryClient.query(postsQueryOptions(deps.page)),
  component: Posts,
})

function Posts() {
  const { page } = Route.useSearch()
  const { data } = useSuspenseQuery(postsQueryOptions(page))
  // ...
}
```

Values can be read with `Route.useParams()`, `Route.useSearch()`, `Route.useRouteContext()`, and `Route.useLoaderDeps()`, with the same hooks of `getRouteApi('/posts/$postId')`, or with the same hooks imported from TanStack Router with a `from` that is a path string, `Route.id`, or `Route.fullPath`.

### React Router

Examples of **incorrect** code for this rule:

```tsx
/* eslint "@tanstack/query-prefetch/require-prefetch": "error" */
// app/routes/post.tsx

export default function Post({ params }: Route.ComponentProps) {
  const { data } = useSuspenseQuery(postQueryOptions(params.postId))
  // ...
}
```

```tsx
/* eslint "@tanstack/query-prefetch/require-prefetch": "error" */
// app/routes/post.tsx

export async function loader({ params }: Route.LoaderArgs) {
  const queryClient = new QueryClient()
  // Prefetched on the server, but never dehydrated, so the client fetches it again
  await queryClient.prefetchQuery(postQueryOptions(params.postId))
}

export default function Post({ params }: Route.ComponentProps) {
  const { data } = useSuspenseQuery(postQueryOptions(params.postId))
  // ...
}
```

```tsx
/* eslint "@tanstack/query-prefetch/require-prefetch": "error" */
// app/routes/post.tsx

export async function loader({ params }: Route.LoaderArgs) {
  const queryClient = new QueryClient()
  await queryClient.prefetchQuery(postQueryOptions(params.postId))
  // Dehydrated, but no route renders it in a HydrationBoundary, so the client fetches it again
  return { dehydratedState: dehydrate(queryClient) }
}

export default function Post({ params }: Route.ComponentProps) {
  const { data } = useSuspenseQuery(postQueryOptions(params.postId))
  // ...
}
```

Examples of **correct** code for this rule:

```tsx
/* eslint "@tanstack/query-prefetch/require-prefetch": "error" */
// app/routes/post.tsx

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  await queryClient.ensureQueryData(postQueryOptions(params.postId))
}

export default function Post() {
  const { postId } = useParams()
  const { data } = useSuspenseQuery(postQueryOptions(postId))
  // ...
}
```

```tsx
/* eslint "@tanstack/query-prefetch/require-prefetch": "error" */

const router = createBrowserRouter([
  {
    path: '/posts/:postId',
    loader: ({ params }) =>
      queryClient.ensureQueryData(postQueryOptions(params.postId)),
    Component: Post,
  },
])
```

In framework mode, the route modules listed in `app/routes.ts` are checked, if the project depends on `@react-router/dev`. Files that export a `loader` or `clientLoader` or import their route types from `./+types/` are checked too, as are the files of `app/routes` that `@react-router/fs-routes` treats as routes when `routes.ts` doesn't list its routes statically. The loaders of `app/root.tsx` and of the parent routes declared in `routes.ts` count for every route below them, since React Router runs them in parallel. A server `loader` has to return `dehydrate(queryClient)`, and the route's component, the components it renders, or the component or `Layout` of `app/root.tsx` or a parent route has to render that loader's state in a `<HydrationBoundary>` (or pass it to `hydrate()`). A boundary that reads another route's `loaderData`, `useLoaderData()`, or `useRouteLoaderData()` with a literal route ID, like the root's own boundary for a route's loader, doesn't count. State that can't be traced to one route, like state merged from `useMatches()` in `app/root.tsx`, counts for every route.

In data mode, the routes passed to `createBrowserRouter`, `createHashRouter`, and `createMemoryRouter` are checked, including routes arrays from other files, `lazy: () => import('./route')` modules, and components wrapped in elements like `<Suspense>`. The loaders of parent routes count for their child routes. Values can be read with `useParams()`, `useSearchParams()` (matching `new URL(request.url).searchParams` in the loader), `useLoaderData()`, or the `params` and `loaderData` props of a route module's component.

### Next.js App Router and Waku

The rule checks `page` and `layout` files of the Next.js `app` directory, outside of private `_folders`, and pages, layouts, and slices of the Waku `pages` directory, if the project depends on `next` or `waku`. Components loaded with `next/dynamic` or React's `lazy()` are followed too.

Examples of **incorrect** code for this rule:

```tsx
/* eslint "@tanstack/query-prefetch/require-prefetch": "error" */
// app/posts/[id]/page.tsx

import { PostInfo } from './post-info' // a 'use client' component that calls useSuspenseQuery(postQueryOptions(id))

export default async function Page({ params }) {
  const { id } = await params
  return <PostInfo id={id} />
}
```

```tsx
/* eslint "@tanstack/query-prefetch/require-prefetch": "error" */
// app/posts/[id]/page.tsx

export default async function Page({ params }) {
  const { id } = await params
  const queryClient = getQueryClient()
  void queryClient.query(postQueryOptions(id))
  // Prefetched, but not dehydrated into a HydrationBoundary, so it never reaches the client
  return <PostInfo id={id} />
}
```

Examples of **correct** code for this rule:

```tsx
/* eslint "@tanstack/query-prefetch/require-prefetch": "error" */
// app/posts/[id]/page.tsx

export default async function Page({ params }) {
  const { id } = await params
  const queryClient = getQueryClient()
  void queryClient.query(postQueryOptions(id))
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PostInfo id={id} />
    </HydrationBoundary>
  )
}
```

Values can reach client components through props, `useParams()` from `next/navigation` (matching the page's `params`), or `useRouter()` from Waku (matching the page's `path` and `query`). A search param read with `useSearchParams().get('page')` is `null` when it is missing, while the page's `searchParams.page` is `undefined`, so the rule reports queries that only match with this difference: pass the value from the page as a prop instead.

The rule also reports prefetches on the server whose query options are imported from a `'use client'` module, since its exports are client references on the server and can't be called.

## Limitations

- Prefetches that aren't awaited only reach the client if the query client dehydrates pending queries, e.g. with `shouldDehydrateQuery: (query) => defaultShouldDehydrateQuery(query) || query.state.status === 'pending'`. The rule can't check how the query client is configured.
- Only imports of files of the project are followed: relative imports, the `paths` of the nearest `tsconfig.json`, and re-exports. Components from packages are not checked.
- The rule reports problems in the file being linted, so a query in an imported component is reported at the element or route option that leads to it. When only the imported file changes, ESLint caching doesn't re-lint the route.
- Next.js and Waku layouts count for the pages below them, including the server components they pass `children` to, like `<AppShell>{children}</AppShell>`. Their prefetches count as dehydrated if `children` are rendered inside a `<HydrationBoundary>`, in the layout or in one of those components, or if a server component further down renders a `<HydrationBoundary>` around the client component, since server components usually share one query client per request (see `getQueryClient()` in the [Advanced Server Rendering guide](../framework/react/guides/advanced-ssr.md)). Waku slices are rendered on their own, so layouts don't count for them.
- The rule checks that a loader or server component calls `dehydrate()`, but not that it dehydrates the query client it prefetched into. `dehydrate(getQueryClient())` only works if `getQueryClient()` returns the same client on the server, e.g. with React's `cache()`.
- For React Router, a `<HydrationBoundary>` whose state can't be traced to a route's loader data, e.g. one read with `useMatches()`, the `matches` prop, `useRouteLoaderData()` with a route ID that isn't a literal or isn't a file path, or a hook from a package, counts as rendering every route's dehydrated state.
- Waku pages and Next.js pages with `'use client'` are not checked.
- Values read with TanStack Router's `strict: false` can't be traced to a route, so queries that use them are not reported.

## When Not To Use It

If your routes don't prefetch, or you prefer to fetch data when components render, you will not need this rule.

## Attributes

- [x] ✅ Recommended
- [ ] 🔧 Fixable
