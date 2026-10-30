import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { rule } from '../rules/require-prefetch/require-prefetch.rule'
import { code, createProject } from './project-fixture'

RuleTester.afterAll = afterAll
RuleTester.describe = describe
RuleTester.it = it

const ruleTester = new RuleTester()

const queries = code`
  import { QueryClient, queryOptions } from '@tanstack/react-query'

  export const queryClient = new QueryClient()

  export const postOptions = (postId: string | undefined) =>
    queryOptions({ queryKey: ['post', postId], queryFn: () => fetchPost(postId) })

  export const searchOptions = (q: string | null) =>
    queryOptions({ queryKey: ['search', q], queryFn: () => search(q) })
`

/** A React Router framework mode app, with query factories in `app/queries.ts`. */
const frameworkProject = (files: Record<string, string> = {}) =>
  createProject({
    'package.json': JSON.stringify({
      dependencies: { 'react-router': '7.0.0' },
      devDependencies: { '@react-router/dev': '7.0.0' },
    }),
    'app/queries.ts': queries,
    ...files,
  })

/** A React Router data mode app, with query factories in `src/queries.ts`. */
const dataProject = (files: Record<string, string> = {}) =>
  createProject({
    'package.json': JSON.stringify({
      dependencies: { 'react-router-dom': '6.0.0' },
    }),
    'src/queries.ts': queries,
    ...files,
  })

const site = "this route's loader"

ruleTester.run('require-prefetch (React Router)', rule, {
  valid: [
    {
      name: 'framework mode: clientLoader prefetches, component reads useParams',
      filename: frameworkProject()('app/routes/post.tsx'),
      code: code`
        import { useParams } from 'react-router'
        import { useSuspenseQuery } from '@tanstack/react-query'
        import { postOptions, queryClient } from '../queries'
        import type { Route } from './+types/post'

        export async function clientLoader({ params }: Route.ClientLoaderArgs) {
          await queryClient.ensureQueryData(postOptions(params.postId))
        }

        export default function Post() {
          const { postId } = useParams()
          useSuspenseQuery(postOptions(postId))
          return null
        }
      `,
    },
    {
      name: 'framework mode: server loader prefetches and dehydrates, component reads the params prop',
      filename: frameworkProject()('app/routes/post.tsx'),
      code: code`
        import { HydrationBoundary, QueryClient, dehydrate, useSuspenseQuery } from '@tanstack/react-query'
        import { postOptions } from '../queries'
        import type { Route } from './+types/post'

        export async function loader({ params }: Route.LoaderArgs) {
          const queryClient = new QueryClient()
          await queryClient.prefetchQuery(postOptions(params.postId))
          return { dehydratedState: dehydrate(queryClient) }
        }

        export default function PostRoute({ params, loaderData }: Route.ComponentProps) {
          return (
            <HydrationBoundary state={loaderData.dehydratedState}>
              <Post postId={params.postId} />
            </HydrationBoundary>
          )
        }

        function Post({ postId }) {
          useSuspenseQuery(postOptions(postId))
          return null
        }
      `,
    },
    {
      name: 'framework mode: component reads values the loader returns with useLoaderData',
      filename: frameworkProject()('app/routes/post.tsx'),
      code: code`
        import { useLoaderData } from 'react-router'
        import { useSuspenseQuery } from '@tanstack/react-query'
        import { postOptions, queryClient } from '../queries'

        export const clientLoader = async ({ params }) => {
          const postId = params.postId
          void queryClient.query(postOptions(postId))
          return { postId }
        }

        export default function Post() {
          const { postId } = useLoaderData<typeof clientLoader>()
          useSuspenseQuery(postOptions(postId))
          return null
        }
      `,
    },
    {
      name: 'framework mode: search params from the request URL and useSearchParams',
      filename: frameworkProject()('app/routes/search.tsx'),
      code: code`
        import { useSearchParams } from 'react-router'
        import { useQuery } from '@tanstack/react-query'
        import { queryClient, searchOptions } from '../queries'

        export async function clientLoader({ request }) {
          const url = new URL(request.url)
          await queryClient.ensureQueryData(searchOptions(url.searchParams.get('q')))
        }

        export default function Search() {
          const [searchParams] = useSearchParams()
          useQuery(searchOptions(searchParams.get('q')))
          return null
        }
      `,
    },
    {
      name: 'framework mode: files that are not route modules are not checked',
      filename: frameworkProject()('app/components/post.tsx'),
      code: code`
        import { useParams } from 'react-router'
        import { useSuspenseQuery } from '@tanstack/react-query'
        import { postOptions } from '../queries'

        export default function Post() {
          const { postId } = useParams()
          useSuspenseQuery(postOptions(postId))
          return null
        }
      `,
    },
    {
      name: 'data mode: curried loader and component imported from a route file',
      filename: dataProject({
        'src/routes/post.tsx': code`
          import { useParams } from 'react-router-dom'
          import { useSuspenseQuery } from '@tanstack/react-query'
          import { postOptions } from '../queries'

          export const loader = (queryClient) => async ({ params }) => {
            await queryClient.query(postOptions(params.postId))
            return null
          }

          export function Post() {
            const params = useParams()
            useSuspenseQuery(postOptions(params.postId))
            return null
          }
        `,
      })('src/main.tsx'),
      code: code`
        import { createBrowserRouter } from 'react-router-dom'
        import { queryClient } from './queries'
        import { Post, loader as postLoader } from './routes/post'

        export const router = createBrowserRouter([
          { path: '/posts/:postId', loader: postLoader(queryClient), element: <Post /> },
        ])
      `,
    },
    {
      name: 'data mode: a parent route loader prefetches for its child',
      filename: dataProject()('src/main.tsx'),
      code: code`
        import { createBrowserRouter, useParams } from 'react-router-dom'
        import { useSuspenseQuery } from '@tanstack/react-query'
        import { postOptions, queryClient } from './queries'

        function Post() {
          const { postId } = useParams()
          useSuspenseQuery(postOptions(postId))
          return null
        }

        export const router = createBrowserRouter([
          {
            path: '/posts/:postId',
            loader: ({ params }) => queryClient.ensureQueryData(postOptions(params.postId)),
            children: [{ index: true, Component: Post }],
          },
        ])
      `,
    },
    {
      name: 'framework mode: dehydrate called in a helper function, root renders the boundary',
      filename: frameworkProject({
        'app/root.tsx': code`
          import { Outlet, useMatches } from 'react-router'
          import { HydrationBoundary } from '@tanstack/react-query'

          export function Layout({ children }) {
            return <html><body>{children}</body></html>
          }

          export default function App() {
            const matches = useMatches()
            const state = matches.at(-1)?.loaderData?.dehydratedState
            return (
              <HydrationBoundary state={state}>
                <Outlet />
              </HydrationBoundary>
            )
          }
        `,
      })('app/routes/post.tsx'),
      code: code`
        import { useParams } from 'react-router'
        import { QueryClient, dehydrate, useSuspenseQuery } from '@tanstack/react-query'
        import { postOptions } from '../queries'

        function hydrationData(queryClient: QueryClient) {
          return { dehydratedState: dehydrate(queryClient) }
        }

        export async function loader({ params }) {
          const queryClient = new QueryClient()
          await queryClient.prefetchQuery(postOptions(params.postId))
          return hydrationData(queryClient)
        }

        export default function Post() {
          const { postId } = useParams()
          useSuspenseQuery(postOptions(postId))
          return null
        }
      `,
    },
    {
      name: 'framework mode: a parent layout route in routes.ts prefetches',
      filename: frameworkProject({
        'app/routes.ts': code`
          import { layout, route } from '@react-router/dev/routes'

          export default [
            layout('routes/posts.tsx', [route(':postId', 'routes/post.tsx')]),
          ]
        `,
        'app/routes/posts.tsx': code`
          import { Outlet } from 'react-router'
          import { postOptions, queryClient } from '../queries'

          export async function clientLoader({ params }) {
            await queryClient.ensureQueryData(postOptions(params.postId))
          }

          export default function Layout() {
            return <Outlet />
          }
        `,
      })('app/routes/post.tsx'),
      code: code`
        import { useParams } from 'react-router'
        import { useSuspenseQuery } from '@tanstack/react-query'
        import { postOptions } from '../queries'

        export default function Post() {
          const { postId } = useParams()
          useSuspenseQuery(postOptions(postId))
          return null
        }
      `,
    },
    {
      name: 'framework mode: the root route prefetches for every route',
      filename: frameworkProject({
        'app/root.tsx': code`
          import { Outlet } from 'react-router'
          import { postOptions, queryClient } from './queries'

          export async function clientLoader({ params }) {
            await queryClient.ensureQueryData(postOptions(params.postId))
          }

          export default function App() {
            return <Outlet />
          }
        `,
      })('app/routes/post.tsx'),
      code: code`
        import { useParams } from 'react-router'
        import { useSuspenseQuery } from '@tanstack/react-query'
        import { postOptions } from '../queries'

        export default function Post() {
          const { postId } = useParams()
          useSuspenseQuery(postOptions(postId))
          return null
        }
      `,
    },
    {
      name: 'framework mode: a component the route renders renders the boundary',
      filename: frameworkProject({
        'app/components/hydrate.tsx': code`
          import { HydrationBoundary } from '@tanstack/react-query'

          export function Hydrate({ state, children }) {
            return <HydrationBoundary state={state}>{children}</HydrationBoundary>
          }
        `,
      })('app/routes/post.tsx'),
      code: code`
        import { useParams } from 'react-router'
        import { QueryClient, dehydrate, useSuspenseQuery } from '@tanstack/react-query'
        import { Hydrate } from '../components/hydrate'
        import { postOptions } from '../queries'

        export async function loader({ params }) {
          const queryClient = new QueryClient()
          await queryClient.prefetchQuery(postOptions(params.postId))
          return { dehydratedState: dehydrate(queryClient) }
        }

        export default function PostRoute({ loaderData }) {
          return (
            <Hydrate state={loaderData.dehydratedState}>
              <Post />
            </Hydrate>
          )
        }

        function Post() {
          const { postId } = useParams()
          useSuspenseQuery(postOptions(postId))
          return null
        }
      `,
    },
    {
      name: 'framework mode: server loader dehydrates without a boundary, clientLoader also prefetches',
      filename: frameworkProject()('app/routes/post.tsx'),
      code: code`
        import { useParams } from 'react-router'
        import { QueryClient, dehydrate, useSuspenseQuery } from '@tanstack/react-query'
        import { postOptions, queryClient } from '../queries'

        export async function loader({ params }) {
          const serverClient = new QueryClient()
          await serverClient.prefetchQuery(postOptions(params.postId))
          return { dehydratedState: dehydrate(serverClient) }
        }

        export async function clientLoader({ params }) {
          await queryClient.ensureQueryData(postOptions(params.postId))
        }

        export default function Post() {
          const { postId } = useParams()
          useSuspenseQuery(postOptions(postId))
          return null
        }
      `,
    },
    {
      name: 'framework mode: root renders its own boundary, the route renders one with useLoaderData',
      filename: frameworkProject({
        'app/root.tsx': code`
          import { Outlet } from 'react-router'
          import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'

          export async function loader() {
            const queryClient = new QueryClient()
            return { dehydratedState: dehydrate(queryClient) }
          }

          export default function App({ loaderData }) {
            return (
              <HydrationBoundary state={loaderData.dehydratedState}>
                <Outlet />
              </HydrationBoundary>
            )
          }
        `,
        'app/routes/post-boundary.tsx': code`
          import { useLoaderData } from 'react-router'
          import { HydrationBoundary } from '@tanstack/react-query'

          export function PostBoundary({ children }) {
            const { dehydratedState } = useLoaderData()
            return <HydrationBoundary state={dehydratedState}>{children}</HydrationBoundary>
          }
        `,
      })('app/routes/post.tsx'),
      code: code`
        import { useParams } from 'react-router'
        import { QueryClient, dehydrate, useSuspenseQuery } from '@tanstack/react-query'
        import { postOptions } from '../queries'
        import { PostBoundary } from './post-boundary'

        export async function loader({ params }) {
          const queryClient = new QueryClient()
          await queryClient.prefetchQuery(postOptions(params.postId))
          return { dehydratedState: dehydrate(queryClient) }
        }

        export default function PostRoute() {
          return (
            <PostBoundary>
              <Post />
            </PostBoundary>
          )
        }

        function Post() {
          const { postId } = useParams()
          useSuspenseQuery(postOptions(postId))
          return null
        }
      `,
    },
    {
      name: "framework mode: the root's loader prefetches for a route without a loader, and root renders its state",
      filename: frameworkProject({
        'app/root.tsx': code`
          import { Outlet } from 'react-router'
          import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
          import { searchOptions } from './queries'

          export async function loader() {
            const queryClient = new QueryClient()
            await queryClient.prefetchQuery(searchOptions(null))
            return { dehydratedState: dehydrate(queryClient) }
          }

          export default function App({ loaderData }) {
            return (
              <HydrationBoundary state={loaderData.dehydratedState}>
                <Outlet />
              </HydrationBoundary>
            )
          }
        `,
      })('app/routes/settings.tsx'),
      code: code`
        import { useQuery } from '@tanstack/react-query'
        import { searchOptions } from '../queries'
        import type { Route } from './+types/settings'

        export default function Settings() {
          useQuery(searchOptions(null))
          return null
        }
      `,
    },
    {
      name: 'framework mode: files next to a route in a route folder are not route modules',
      filename: frameworkProject()('app/routes/posts.$postId/post-header.tsx'),
      code: code`
        import { useParams } from 'react-router'
        import { useSuspenseQuery } from '@tanstack/react-query'
        import { postOptions } from '../../queries'

        export default function PostHeader() {
          const { postId } = useParams()
          useSuspenseQuery(postOptions(postId))
          return null
        }
      `,
    },
    {
      name: 'framework mode: files not listed in routes.ts are not route modules',
      filename: frameworkProject({
        'app/routes.ts': code`
          import { index } from '@react-router/dev/routes'

          export default [index('routes/home.tsx')]
        `,
      })('app/routes/post-card.tsx'),
      code: code`
        import { useParams } from 'react-router'
        import { useSuspenseQuery } from '@tanstack/react-query'
        import { postOptions } from '../queries'

        export default function PostCard() {
          const { postId } = useParams()
          useSuspenseQuery(postOptions(postId))
          return null
        }
      `,
    },
  ],
  invalid: [
    {
      name: 'framework mode: a route listed in routes.ts without a loader',
      filename: frameworkProject({
        'app/routes.ts': code`
          import { route } from '@react-router/dev/routes'

          export default [route('posts/:postId', 'pages/post.tsx')]
        `,
      })('app/pages/post.tsx'),
      code: code`
        import { useParams } from 'react-router'
        import { useSuspenseQuery } from '@tanstack/react-query'
        import { postOptions } from '../queries'

        export default function Post() {
          const { postId } = useParams()
          useSuspenseQuery(postOptions(postId))
          return null
        }
      `,
      errors: [{ messageId: 'missingPrefetch', line: 7 }],
    },
    {
      name: 'data mode: routes array wrapped in satisfies',
      filename: dataProject()('src/main.tsx'),
      code: code`
        import { createBrowserRouter, useParams } from 'react-router-dom'
        import type { RouteObject } from 'react-router-dom'
        import { useSuspenseQuery } from '@tanstack/react-query'
        import { postOptions } from './queries'

        function Post() {
          const { postId } = useParams()
          useSuspenseQuery(postOptions(postId))
          return null
        }

        const routes = [{ path: '/posts/:postId', Component: Post }] satisfies RouteObject[]

        export const router = createBrowserRouter(routes as RouteObject[])
      `,
      errors: [{ messageId: 'missingPrefetch', line: 8 }],
    },
    {
      name: 'data mode: routes array imported from another file',
      filename: dataProject({
        'src/routes.tsx': code`
          import { Post } from './routes/post'

          export const routes = [{ path: '/posts/:postId', element: <Post /> }]
        `,
        'src/routes/post.tsx': code`
          import { useParams } from 'react-router-dom'
          import { useSuspenseQuery } from '@tanstack/react-query'
          import { postOptions } from '../queries'

          export function Post() {
            const { postId } = useParams()
            useSuspenseQuery(postOptions(postId))
            return null
          }
        `,
      })('src/main.tsx'),
      code: code`
        import { createBrowserRouter } from 'react-router-dom'
        import { routes } from './routes'

        export const router = createBrowserRouter(routes)
      `,
      errors: [
        {
          messageId: 'missingPrefetch',
          line: 4,
          data: {
            hook: 'useSuspenseQuery',
            method: 'query',
            options: 'postOptions(postId)',
            location: " in './routes/post.tsx'",
            site,
          },
        },
      ],
    },
    {
      name: 'data mode: element wrapped in Suspense',
      filename: dataProject()('src/main.tsx'),
      code: code`
        import { Suspense } from 'react'
        import { createBrowserRouter, useParams } from 'react-router-dom'
        import { useSuspenseQuery } from '@tanstack/react-query'
        import { postOptions } from './queries'

        function Post() {
          const { postId } = useParams()
          useSuspenseQuery(postOptions(postId))
          return null
        }

        export const router = createBrowserRouter([
          {
            path: '/posts/:postId',
            element: (
              <Suspense fallback={null}>
                <Post />
              </Suspense>
            ),
          },
        ])
      `,
      errors: [{ messageId: 'missingPrefetch', line: 8 }],
    },
    {
      name: 'data mode: lazy route module',
      filename: dataProject({
        'src/routes/post.tsx': code`
          import { useParams } from 'react-router-dom'
          import { useSuspenseQuery } from '@tanstack/react-query'
          import { postOptions } from '../queries'

          export function Component() {
            const { postId } = useParams()
            useSuspenseQuery(postOptions(postId))
            return null
          }
        `,
      })('src/main.tsx'),
      code: code`
        import { createBrowserRouter } from 'react-router-dom'

        export const router = createBrowserRouter([
          { path: '/posts/:postId', lazy: () => import('./routes/post') },
        ])
      `,
      errors: [{ messageId: 'missingPrefetch', line: 4 }],
    },
    {
      name: 'framework mode: route module without a loader',
      filename: frameworkProject()('app/routes/post.tsx'),
      code: code`
        import { useSuspenseQuery } from '@tanstack/react-query'
        import { postOptions } from '../queries'
        import type { Route } from './+types/post'

        export default function Post({ params }: Route.ComponentProps) {
          useSuspenseQuery(postOptions(params.postId))
          return null
        }
      `,
      errors: [
        {
          messageId: 'missingPrefetch',
          line: 6,
          data: {
            hook: 'useSuspenseQuery',
            method: 'query',
            options: 'postOptions(params.postId)',
            location: '',
            site,
          },
        },
      ],
    },
    {
      name: 'framework mode: server loader prefetches without dehydrating',
      filename: frameworkProject()('app/routes/post.tsx'),
      code: code`
        import { useParams } from 'react-router'
        import { QueryClient, useSuspenseQuery } from '@tanstack/react-query'
        import { postOptions } from '../queries'

        export async function loader({ params }) {
          const queryClient = new QueryClient()
          await queryClient.prefetchQuery(postOptions(params.postId))
          return null
        }

        export default function Post() {
          const { postId } = useParams()
          useSuspenseQuery(postOptions(postId))
          return null
        }
      `,
      errors: [{ messageId: 'loaderNotDehydrated', line: 13 }],
    },
    {
      name: 'framework mode: server loader dehydrates, but no route renders a boundary',
      filename: frameworkProject({
        'app/root.tsx': code`
          import { Outlet } from 'react-router'

          export default function App() {
            return <Outlet />
          }
        `,
      })('app/routes/post.tsx'),
      code: code`
        import { useParams } from 'react-router'
        import { QueryClient, dehydrate, useSuspenseQuery } from '@tanstack/react-query'
        import { postOptions } from '../queries'

        export async function loader({ params }) {
          const queryClient = new QueryClient()
          await queryClient.prefetchQuery(postOptions(params.postId))
          return { dehydratedState: dehydrate(queryClient) }
        }

        export default function Post() {
          const { postId } = useParams()
          useSuspenseQuery(postOptions(postId))
          return null
        }
      `,
      errors: [{ messageId: 'loaderNotHydrated', line: 13 }],
    },
    {
      name: "framework mode: only the root's boundary renders, with the root's loader data",
      filename: frameworkProject({
        'app/root.tsx': code`
          import { Outlet } from 'react-router'
          import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'

          export async function loader() {
            const queryClient = new QueryClient()
            return { dehydratedState: dehydrate(queryClient) }
          }

          export default function App({ loaderData }) {
            return (
              <HydrationBoundary state={loaderData.dehydratedState}>
                <Outlet />
              </HydrationBoundary>
            )
          }
        `,
      })('app/routes/post.tsx'),
      code: code`
        import { useParams } from 'react-router'
        import { QueryClient, dehydrate, useSuspenseQuery } from '@tanstack/react-query'
        import { postOptions } from '../queries'

        export async function loader({ params }) {
          const queryClient = new QueryClient()
          await queryClient.prefetchQuery(postOptions(params.postId))
          return { dehydratedState: dehydrate(queryClient) }
        }

        export default function Post() {
          const { postId } = useParams()
          useSuspenseQuery(postOptions(postId))
          return null
        }
      `,
      errors: [{ messageId: 'loaderNotHydrated', line: 13 }],
    },
    {
      name: "framework mode: the route's boundary reads the root's data with useRouteLoaderData('root')",
      filename: frameworkProject({
        'app/root.tsx': code`
          import { Outlet } from 'react-router'

          export async function loader() {
            return { dehydratedState: null }
          }

          export default function App() {
            return <Outlet />
          }
        `,
      })('app/routes/post.tsx'),
      code: code`
        import { useParams, useRouteLoaderData } from 'react-router'
        import { HydrationBoundary, QueryClient, dehydrate, useSuspenseQuery } from '@tanstack/react-query'
        import { postOptions } from '../queries'

        export async function loader({ params }) {
          const queryClient = new QueryClient()
          await queryClient.prefetchQuery(postOptions(params.postId))
          return { dehydratedState: dehydrate(queryClient) }
        }

        export default function PostRoute() {
          const rootData = useRouteLoaderData('root')
          return (
            <HydrationBoundary state={rootData.dehydratedState}>
              <Post />
            </HydrationBoundary>
          )
        }

        function Post() {
          const { postId } = useParams()
          useSuspenseQuery(postOptions(postId))
          return null
        }
      `,
      errors: [{ messageId: 'loaderNotHydrated', line: 22 }],
    },
    {
      name: 'framework mode: search param prefetched under another name',
      filename: frameworkProject()('app/routes/search.tsx'),
      code: code`
        import { useSearchParams } from 'react-router'
        import { useQuery } from '@tanstack/react-query'
        import { queryClient, searchOptions } from '../queries'

        export async function clientLoader({ request }) {
          const q = new URL(request.url).searchParams.get('query')
          await queryClient.ensureQueryData(searchOptions(q))
        }

        export default function Search() {
          const [searchParams] = useSearchParams()
          useQuery(searchOptions(searchParams.get('q')))
          return null
        }
      `,
      errors: [{ messageId: 'missingPrefetch', line: 12 }],
    },
    {
      name: 'data mode: element imported from another file, without a loader',
      filename: dataProject({
        'src/routes/post.tsx': code`
          import { useParams } from 'react-router-dom'
          import { useSuspenseQuery } from '@tanstack/react-query'
          import { postOptions } from '../queries'

          export function Post() {
            const { postId } = useParams()
            useSuspenseQuery(postOptions(postId))
            return null
          }
        `,
      })('src/main.tsx'),
      code: code`
        import { createBrowserRouter } from 'react-router-dom'
        import { Post } from './routes/post'

        export const router = createBrowserRouter([
          { path: '/posts/:postId', element: <Post /> },
        ])
      `,
      errors: [
        {
          messageId: 'missingPrefetch',
          line: 5,
          data: {
            hook: 'useSuspenseQuery',
            method: 'query',
            options: 'postOptions(postId)',
            location: " in './routes/post.tsx'",
            site,
          },
        },
      ],
    },
  ],
})
