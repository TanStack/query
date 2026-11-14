# TanStack Vue Query 2.7 Basic Example

The basic posts example on Vue 2.7.

## How it works

- `src/services/posts/queries.ts` defines `postsQueries.list()` and `postsQueries.detail(id)`, `queryOptions` factories keyed by `['posts', 'list']` and `['posts', 'detail', id]`.
- `src/Posts.vue` reads the list with `useQuery(postsQueries.list())` and marks a post as visited when `queryClient.getQueryData(postsQueries.detail(item.id).queryKey)` returns data.
- `src/Post.vue` passes a getter, `useQuery(() => postsQueries.detail(props.postId))`, so the query follows the `postId` prop. A cached post renders at once and shows "Background Updating..." while `isFetching` is `true`.
- `src/main.ts` installs `VueQueryPlugin` with `Vue.use` and mounts the app with `new Vue`, using Vue 2.7's built-in Composition API.

To run this example:

- `npm install`
- `npm run dev`
