import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { RouteObject } from 'react-router-dom'
import { Root } from './routes/root'
import { PostList, PostsLayout, loader as postsLoader } from './routes/posts'
import { Post, loader as postLoader } from './routes/post'
import { User, loader as userLoader } from './routes/user'
import { Settings, loader as settingsLoader } from './routes/settings'
import { About } from './routes/about'
import { EditPost } from './routes/edit-post'
import { Notifications } from './routes/notifications'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60 * 1000 } },
})

// The routes are declared with `satisfies RouteObject[]`, which the rule looks through.
const routes = [
  {
    path: '/',
    element: <Root />,
    children: [
      {
        // ✅ passes: the `/posts` loader prefetches the post list, and the parent's loader runs for
        // the index route too, so `PostList` finds it in the cache.
        path: 'posts',
        loader: postsLoader(queryClient),
        Component: PostsLayout,
        children: [
          { index: true, Component: PostList },
          {
            // ✅ passes: the curried `postLoader(queryClient)` prefetches `postOptions(params.postId)`,
            // and `<Post />` reads the same param with `useParams()`.
            path: ':postId',
            loader: postLoader(queryClient),
            element: <Post />,
          },
        ],
      },
      {
        // ✅ passes: `Component: User` reads the `userId` that the loader returns with
        // `useLoaderData()`, which is the id the loader prefetched with.
        path: 'users/:userId',
        loader: userLoader(queryClient),
        Component: User,
      },
      {
        // ❌ fails: the loader prefetches the user, but `<Settings />` queries the user's settings.
        path: 'users/:userId/settings',
        loader: settingsLoader(queryClient),
        // eslint-disable-next-line @tanstack/query/require-route-prefetch -- The query 'settingsOptions(userId)' used by 'useSuspenseQuery' in './routes/settings.tsx' isn't prefetched in this route's loader, so it only starts fetching after the component renders. Start it in this route's loader by passing the same query options to 'queryClient.query()'.
        element: <Settings />,
      },
      {
        // ❌ fails: this route has no loader, so the team only starts fetching once `<About />`
        // renders.
        path: 'about',
        // eslint-disable-next-line @tanstack/query/require-route-prefetch -- The query 'teamOptions()' used by 'useSuspenseQuery' in './routes/about.tsx' isn't prefetched in this route's loader, so it only starts fetching after the component renders. Start it in this route's loader by passing the same query options to 'queryClient.query()'.
        element: <About />,
      },
      {
        // ❌ fails: in this `satisfies RouteObject[]` array, the edit route has no loader, so the post
        // only starts fetching once `EditPost` renders.
        path: 'posts/:postId/edit',
        // eslint-disable-next-line @tanstack/query/require-route-prefetch -- The query 'postOptions(postId)' used by 'useSuspenseQuery' in './routes/edit-post.tsx' isn't prefetched in this route's loader, so it only starts fetching after the component renders. Start it in this route's loader by passing the same query options to 'queryClient.query()'.
        Component: EditPost,
      },
      {
        // ❌ fails: the rule looks inside `<Suspense>`, which only delays the fetch to render time; the
        // route still needs a loader.
        path: 'notifications',
        element: (
          <Suspense fallback={null}>
            {/* eslint-disable-next-line @tanstack/query/require-route-prefetch -- The query 'notificationsOptions()' used by 'useSuspenseQuery' in './routes/notifications.tsx' isn't prefetched in this route's loader, so it only starts fetching after the component renders. Start it in this route's loader by passing the same query options to 'queryClient.query()'. */}
            <Notifications />
          </Suspense>
        ),
      },
      {
        // ❌ fails: the lazy route module exports `Component` but no `loader`, so the billing query
        // isn't prefetched.
        path: 'billing',
        // eslint-disable-next-line @tanstack/query/require-route-prefetch -- The query 'billingOptions()' used by 'useSuspenseQuery' in './routes/billing.tsx' isn't prefetched in this route's loader, so it only starts fetching after the component renders. Start it in this route's loader by passing the same query options to 'queryClient.query()'.
        lazy: () => import('./routes/billing'),
      },
    ],
  },
] satisfies RouteObject[]

const router = createBrowserRouter(routes)

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Missing #root element')

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
