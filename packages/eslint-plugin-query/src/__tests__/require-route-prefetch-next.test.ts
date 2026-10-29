import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { rule } from '../rules/require-route-prefetch/require-route-prefetch.rule'
import { code, createProject } from './project-fixture'

RuleTester.afterAll = afterAll
RuleTester.describe = describe
RuleTester.it = it

const ruleTester = new RuleTester()

const packageJson = JSON.stringify({ dependencies: { next: '16.0.0' } })

const queries = code`
  import { queryOptions } from '@tanstack/react-query'

  export const postOptions = (id: string) =>
    queryOptions({ queryKey: ['post', id], queryFn: () => fetchPost(id) })

  export const postsOptions = (page: string | undefined) =>
    queryOptions({ queryKey: ['posts', page], queryFn: () => fetchPosts(page) })

  export const userOptions = queryOptions({ queryKey: ['user'], queryFn: fetchUser })
`

const postInfo = code`
  'use client'
  import { useSuspenseQuery } from '@tanstack/react-query'
  import { postOptions } from '../../queries'

  export function PostInfo({ id }: { id: string }) {
    const { data } = useSuspenseQuery(postOptions(id))
    return <h1>{data.title}</h1>
  }
`

/**
 * Creates a Next.js project with query factories in `app/queries.ts` and a `'use client'` component
 * `PostInfo` in `app/posts/[id]/post-info.tsx`.
 */
function nextProject(files: Record<string, string> = {}) {
  return createProject({
    'package.json': packageJson,
    'app/queries.ts': queries,
    'app/posts/[id]/post-info.tsx': postInfo,
    ...files,
  })
}

const site = 'this page'

ruleTester.run('require-route-prefetch (Next.js)', rule, {
  valid: [
    {
      name: 'page prefetches the query its client component uses, and dehydrates it',
      filename: nextProject()('app/posts/[id]/page.tsx'),
      code: code`
        import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
        import { getQueryClient } from '../../get-query-client'
        import { postOptions } from '../../queries'
        import { PostInfo } from './post-info'

        export default async function Page({ params }: { params: Promise<{ id: string }> }) {
          const { id } = await params
          const queryClient = getQueryClient()
          void queryClient.query(postOptions(id))
          return (
            <HydrationBoundary state={dehydrate(queryClient)}>
              <PostInfo id={id} />
            </HydrationBoundary>
          )
        }
      `,
    },
    {
      name: 'client component reads the params with useParams',
      filename: nextProject({
        'app/posts/[id]/post-info.tsx': code`
          'use client'
          import { useSuspenseQuery } from '@tanstack/react-query'
          import { useParams } from 'next/navigation'
          import { postOptions } from '../../queries'

          export function PostInfo() {
            const params = useParams<{ id: string }>()
            useSuspenseQuery(postOptions(params.id))
            return null
          }
        `,
      })('app/posts/[id]/page.tsx'),
      code: code`
        import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
        import { postOptions } from '../../queries'
        import { PostInfo } from './post-info'

        export default async function Page(props: { params: Promise<{ id: string }> }) {
          const queryClient = new QueryClient()
          await queryClient.prefetchQuery(postOptions((await props.params).id))
          return (
            <HydrationBoundary state={dehydrate(queryClient)}>
              <PostInfo />
            </HydrationBoundary>
          )
        }
      `,
    },
    {
      name: 'a layout above the page prefetches and dehydrates around its children',
      filename: nextProject({
        'app/layout.tsx': code`
          import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
          import { userOptions } from './queries'

          export default function RootLayout({ children }) {
            const queryClient = new QueryClient()
            void queryClient.query(userOptions)
            return (
              <html>
                <body>
                  <HydrationBoundary state={dehydrate(queryClient)}>{children}</HydrationBoundary>
                </body>
              </html>
            )
          }
        `,
        'app/account/user-menu.tsx': code`
          'use client'
          import { useSuspenseQuery } from '@tanstack/react-query'
          import { userOptions } from '../queries'

          export const UserMenu = () => {
            useSuspenseQuery(userOptions)
            return null
          }
        `,
      })('app/account/page.tsx'),
      code: code`
        import { UserMenu } from './user-menu'

        export default function Page() {
          return <UserMenu />
        }
      `,
    },
    {
      name: 'prefetch in a helper function from another file',
      filename: nextProject({
        'app/prefetch.ts': code`
          import { postOptions } from './queries'

          export function prefetchPost(queryClient, id: string) {
            return queryClient.query(postOptions(id))
          }
        `,
      })('app/posts/[id]/page.tsx'),
      code: code`
        import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
        import { prefetchPost } from '../../prefetch'
        import { PostInfo } from './post-info'

        export default async function Page({ params }) {
          const { id } = await params
          const queryClient = new QueryClient()
          void prefetchPost(queryClient, id)
          return (
            <HydrationBoundary state={dehydrate(queryClient)}>
              <PostInfo id={id} />
            </HydrationBoundary>
          )
        }
      `,
    },
    {
      name: 'a nested server component prefetches and dehydrates its own queries',
      filename: nextProject()('app/posts/[id]/page.tsx'),
      code: code`
        import { Suspense } from 'react'
        import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
        import { postOptions } from '../../queries'
        import { PostInfo } from './post-info'

        export default async function Page({ params }) {
          const { id } = await params
          return (
            <Suspense>
              <Post id={id} />
            </Suspense>
          )
        }

        async function Post({ id }: { id: string }) {
          const queryClient = new QueryClient()
          await queryClient.prefetchQuery(postOptions(id))
          return (
            <HydrationBoundary state={dehydrate(queryClient)}>
              <PostInfo id={id} />
            </HydrationBoundary>
          )
        }
      `,
    },
    {
      name: 'query factories imported through a tsconfig path alias and a barrel file',
      filename: nextProject({
        'tsconfig.json': JSON.stringify({
          compilerOptions: { paths: { '@/*': ['./*'] } },
        }),
        'app/index.ts': `export * from './queries'\n`,
      })('app/posts/[id]/page.tsx'),
      code: code`
        import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
        import { postOptions as post } from '@/app'
        import { PostInfo } from './post-info'

        export default async function Page({ params }) {
          const { id } = await params
          const queryClient = new QueryClient()
          void queryClient.query(post(id))
          return (
            <HydrationBoundary state={dehydrate(queryClient)}>
              <PostInfo id={id} />
            </HydrationBoundary>
          )
        }
      `,
    },
    {
      name: 'queries that depend on client state are not reported',
      filename: nextProject({
        'app/posts/[id]/post-info.tsx': code`
          'use client'
          import { useState } from 'react'
          import { useQuery } from '@tanstack/react-query'
          import { postOptions } from '../../queries'

          export function PostInfo() {
            const [id] = useState('1')
            useQuery(postOptions(id))
            return null
          }
        `,
      })('app/posts/[id]/page.tsx'),
      code: code`
        import { PostInfo } from './post-info'

        export default function Page() {
          return <PostInfo />
        }
      `,
    },
    {
      name: 'projects that do not depend on Next.js are not checked as Next.js apps',
      filename: createProject({
        'package.json': JSON.stringify({ dependencies: { react: '19' } }),
        'app/queries.ts': queries,
        'app/posts/[id]/post-info.tsx': postInfo,
      })('app/posts/[id]/page.tsx'),
      code: code`
        import { PostInfo } from './post-info'

        export default function Page() {
          return <PostInfo id="1" />
        }
      `,
    },
    {
      name: 'client pages can not prefetch on the server and are not checked',
      filename: nextProject()('app/posts/[id]/page.tsx'),
      code: code`
        'use client'
        import { PostInfo } from './post-info'

        export default function Page() {
          return <PostInfo id="1" />
        }
      `,
    },
    {
      name: 'a route folder named app is not the app directory',
      filename: nextProject({
        'app/layout.tsx': code`
          import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
          import { userOptions } from './queries'

          export default function RootLayout({ children }) {
            const queryClient = new QueryClient()
            void queryClient.query(userOptions)
            return <HydrationBoundary state={dehydrate(queryClient)}>{children}</HydrationBoundary>
          }
        `,
        'app/docs/app/user-menu.tsx': code`
          'use client'
          import { useSuspenseQuery } from '@tanstack/react-query'
          import { userOptions } from '../../queries'

          export const UserMenu = () => {
            useSuspenseQuery(userOptions)
            return null
          }
        `,
      })('app/docs/app/page.tsx'),
      code: code`
        import { UserMenu } from './user-menu'

        export default function Page() {
          return <UserMenu />
        }
      `,
    },
    {
      name: 'a module constant matches the same literal',
      filename: nextProject()('app/posts/[id]/page.tsx'),
      code: code`
        import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
        import { postOptions } from '../../queries'
        import { PostInfo } from './post-info'

        const FEATURED = 'featured'

        export default async function Page() {
          const queryClient = new QueryClient()
          await queryClient.prefetchQuery(postOptions(FEATURED))
          return (
            <HydrationBoundary state={dehydrate(queryClient)}>
              <PostInfo id="featured" />
            </HydrationBoundary>
          )
        }
      `,
    },
    {
      name: 'inline options match an inline prefetch with the same query key',
      filename: nextProject({
        'app/posts/posts.tsx': code`
          'use client'
          import { useQuery } from '@tanstack/react-query'
          import { getPosts } from './api'

          export function Posts() {
            useQuery({ queryKey: ['posts'], queryFn: getPosts })
            return null
          }
        `,
      })('app/posts/page.tsx'),
      code: code`
        import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
        import { getPosts } from './api'
        import { Posts } from './posts'

        export default async function Page() {
          const queryClient = new QueryClient()
          await queryClient.prefetchQuery({ queryKey: ['posts'], queryFn: getPosts })
          return (
            <HydrationBoundary state={dehydrate(queryClient)}>
              <Posts />
            </HydrationBoundary>
          )
        }
      `,
    },
    {
      name: 'private folders are not routes',
      filename: nextProject()('app/_components/page.tsx'),
      code: code`
        import { PostInfo } from '../posts/[id]/post-info'

        export default function Page() {
          return <PostInfo id="1" />
        }
      `,
    },
  ],
  invalid: [
    {
      name: 'a layout prefetches but does not dehydrate around its children',
      filename: nextProject({
        'app/posts/layout.tsx': code`
          import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
          import { postOptions } from '../queries'

          export default async function Layout({ children }) {
            const queryClient = new QueryClient()
            await queryClient.prefetchQuery(postOptions('1'))
            return (
              <div>
                <HydrationBoundary state={dehydrate(queryClient)}>
                  <nav />
                </HydrationBoundary>
                {children}
              </div>
            )
          }
        `,
      })('app/posts/[id]/page.tsx'),
      code: code`
        import { PostInfo } from './post-info'

        export default function Page() {
          return <PostInfo id="1" />
        }
      `,
      errors: [
        {
          messageId: 'notDehydrated',
          data: {
            hook: 'useSuspenseQuery',
            method: 'query',
            options: 'postOptions(id)',
            location: " in './post-info.tsx'",
            site: "'../layout.tsx'",
          },
        },
      ],
    },
    {
      name: 'components loaded with next/dynamic',
      filename: nextProject()('app/posts/[id]/page.tsx'),
      code: code`
        import dynamic from 'next/dynamic'

        const PostInfo = dynamic(() => import('./post-info').then((mod) => mod.PostInfo))

        export default async function Page({ params }) {
          const { id } = await params
          return <PostInfo id={id} />
        }
      `,
      errors: [{ messageId: 'missingPrefetch', line: 7 }],
    },
    {
      name: 'client component query is not prefetched by the page',
      filename: nextProject()('app/posts/[id]/page.tsx'),
      code: code`
        import { PostInfo } from './post-info'

        export default async function Page({ params }) {
          const { id } = await params
          return <PostInfo id={id} />
        }
      `,
      errors: [
        {
          messageId: 'missingPrefetch',
          line: 5,
          data: {
            hook: 'useSuspenseQuery',
            method: 'query',
            options: 'postOptions(id)',
            location: " in './post-info.tsx'",
            site,
          },
        },
      ],
    },
    {
      name: 'prefetched but not rendered inside a HydrationBoundary',
      filename: nextProject()('app/posts/[id]/page.tsx'),
      code: code`
        import { QueryClient } from '@tanstack/react-query'
        import { postOptions } from '../../queries'
        import { PostInfo } from './post-info'

        export default async function Page({ params }) {
          const { id } = await params
          const queryClient = new QueryClient()
          await queryClient.prefetchQuery(postOptions(id))
          return <PostInfo id={id} />
        }
      `,
      errors: [{ messageId: 'notDehydrated', line: 9 }],
    },
    {
      name: 'prefetched by a server component below the boundary that dehydrated the page',
      filename: nextProject()('app/posts/[id]/page.tsx'),
      code: code`
        import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
        import { postOptions } from '../../queries'
        import { PostInfo } from './post-info'

        export default async function Page({ params }) {
          const { id } = await params
          const queryClient = new QueryClient()
          return (
            <HydrationBoundary state={dehydrate(queryClient)}>
              <Post id={id} />
            </HydrationBoundary>
          )
        }

        async function Post({ id }) {
          const queryClient = new QueryClient()
          await queryClient.prefetchQuery(postOptions(id))
          return <PostInfo id={id} />
        }
      `,
      errors: [{ messageId: 'notDehydrated', line: 18 }],
    },
    {
      name: "query options imported from a 'use client' module",
      filename: nextProject({
        'app/posts/[id]/post-info.tsx': code`
          'use client'
          import { queryOptions, useSuspenseQuery } from '@tanstack/react-query'

          export const postOptions = (id: string) =>
            queryOptions({ queryKey: ['post', id], queryFn: () => fetchPost(id) })

          export function PostInfo({ id }: { id: string }) {
            useSuspenseQuery(postOptions(id))
            return null
          }
        `,
      })('app/posts/[id]/page.tsx'),
      code: code`
        import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
        import { PostInfo, postOptions } from './post-info'

        export default async function Page({ params }) {
          const { id } = await params
          const queryClient = new QueryClient()
          void queryClient.query(postOptions(id))
          return (
            <HydrationBoundary state={dehydrate(queryClient)}>
              <PostInfo id={id} />
            </HydrationBoundary>
          )
        }
      `,
      errors: [
        {
          messageId: 'clientQueryOptions',
          line: 7,
          data: { name: 'postOptions', file: './post-info.tsx' },
        },
      ],
    },
    {
      name: 'search param read with useSearchParams while the page prefetches it from searchParams',
      filename: nextProject({
        'app/posts/post-list.tsx': code`
          'use client'
          import { useSuspenseQuery } from '@tanstack/react-query'
          import { useSearchParams } from 'next/navigation'
          import { postsOptions } from '../queries'

          export function PostList() {
            const searchParams = useSearchParams()
            useSuspenseQuery(postsOptions(searchParams.get('page')))
            return null
          }
        `,
      })('app/posts/page.tsx'),
      code: code`
        import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
        import { postsOptions } from '../queries'
        import { PostList } from './post-list'

        export default async function Page({ searchParams }) {
          const { page } = await searchParams
          const queryClient = new QueryClient()
          void queryClient.query(postsOptions(page))
          return (
            <HydrationBoundary state={dehydrate(queryClient)}>
              <PostList />
            </HydrationBoundary>
          )
        }
      `,
      errors: [{ messageId: 'searchParamsMismatch', line: 11 }],
    },
    {
      name: 'queries of client components rendered by other client components',
      filename: nextProject({
        'app/posts/feed.tsx': code`
          'use client'
          import { PostCard } from './post-card'

          export function Feed({ ids }: { ids: Array<string> }) {
            return <PostCard id={ids[0]} />
          }
        `,
        'app/posts/post-card.tsx': code`
          'use client'
          import { useQuery } from '@tanstack/react-query'
          import { postOptions } from '../queries'

          export function PostCard({ id }) {
            useQuery(postOptions(id))
            return null
          }
        `,
      })('app/posts/page.tsx'),
      code: code`
        import { Feed } from './feed'

        export default function Page() {
          return <Feed ids={['1', '2']} />
        }
      `,
      errors: [
        {
          messageId: 'missingPrefetch',
          line: 4,
          data: {
            hook: 'useQuery',
            method: 'query',
            options: 'postOptions(id)',
            location: " in './post-card.tsx'",
            site,
          },
        },
      ],
    },
    {
      name: 'a layout renders a client component whose query it does not prefetch',
      filename: nextProject({
        'app/account/user-menu.tsx': code`
          'use client'
          import { useSuspenseQuery } from '@tanstack/react-query'
          import { userOptions } from '../queries'

          export const UserMenu = () => {
            useSuspenseQuery(userOptions)
            return null
          }
        `,
      })('app/account/layout.tsx'),
      code: code`
        import { UserMenu } from './user-menu'

        export default function Layout({ children }) {
          return (
            <>
              <UserMenu />
              {children}
            </>
          )
        }
      `,
      errors: [
        {
          messageId: 'missingPrefetch',
          line: 6,
          data: {
            hook: 'useSuspenseQuery',
            method: 'query',
            options: 'userOptions',
            location: " in './user-menu.tsx'",
            site: 'this layout',
          },
        },
      ],
    },
  ],
})
