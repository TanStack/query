import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { rule } from '../rules/require-route-prefetch/require-route-prefetch.rule'
import { code, createProject } from './project-fixture'

RuleTester.afterAll = afterAll
RuleTester.describe = describe
RuleTester.it = it

const ruleTester = new RuleTester()

const queries = code`
  import { queryOptions } from '@tanstack/react-query'

  export const postOptions = (id: string) =>
    queryOptions({ queryKey: ['post', id], queryFn: () => fetchPost(id) })

  export const searchOptions = (query: string) =>
    queryOptions({ queryKey: ['search', query], queryFn: () => search(query) })

  export const userOptions = queryOptions({ queryKey: ['user'], queryFn: fetchUser })
`

/**
 * Creates a Waku project with query factories in `src/queries.ts` and a `'use client'` component
 * `PostInfo` in `src/components/post-info.tsx`.
 */
const wakuProject = (files: Record<string, string> = {}) =>
  createProject({
    'package.json': JSON.stringify({ dependencies: { waku: '1.0.0' } }),
    'src/queries.ts': queries,
    'src/components/post-info.tsx': code`
      'use client'
      import { useSuspenseQuery } from '@tanstack/react-query'
      import { postOptions } from '../queries'

      export function PostInfo({ id }: { id: string }) {
        useSuspenseQuery(postOptions(id))
        return null
      }
    `,
    ...files,
  })

const prefetchingPage = code`
  import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
  import type { PageProps } from 'waku/router'
  import { postOptions } from '../../queries'
  import { PostInfo } from '../../components/post-info'

  export default async function PostPage({ id }: PageProps<'/posts/[id]'>) {
    const queryClient = new QueryClient()
    await queryClient.prefetchQuery(postOptions(id))
    return (
      <HydrationBoundary state={dehydrate(queryClient)}>
        <PostInfo id={id} />
      </HydrationBoundary>
    )
  }

  export const getConfig = async () => ({ render: 'dynamic' }) as const
`

ruleTester.run('require-route-prefetch (Waku)', rule, {
  valid: [
    {
      name: 'page prefetches with its slug prop and dehydrates',
      filename: wakuProject()('src/pages/posts/[id].tsx'),
      code: prefetchingPage,
    },
    {
      name: 'client component reads the query string with useRouter',
      filename: wakuProject({
        'src/components/results.tsx': code`
          'use client'
          import { useQuery } from '@tanstack/react-query'
          import { useRouter } from 'waku'
          import { searchOptions } from '../queries'

          export function Results() {
            const { query } = useRouter()
            useQuery(searchOptions(query))
            return null
          }
        `,
      })('src/pages/search.tsx'),
      code: code`
        import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
        import { searchOptions } from '../queries'
        import { Results } from '../components/results'

        export default async function SearchPage({ query }) {
          const queryClient = new QueryClient()
          void queryClient.query(searchOptions(query))
          return (
            <HydrationBoundary state={dehydrate(queryClient)}>
              <Results />
            </HydrationBoundary>
          )
        }
      `,
    },
    {
      name: 'a layout prefetches and dehydrates around its children',
      filename: wakuProject({
        'src/pages/_layout.tsx': code`
          import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
          import { userOptions } from '../queries'

          export default async function RootLayout({ children }) {
            const queryClient = new QueryClient()
            await queryClient.prefetchQuery(userOptions)
            return <HydrationBoundary state={dehydrate(queryClient)}>{children}</HydrationBoundary>
          }
        `,
        'src/components/user-menu.tsx': code`
          'use client'
          import { useSuspenseQuery } from '@tanstack/react-query'
          import { userOptions } from '../queries'

          export function UserMenu() {
            useSuspenseQuery(userOptions)
            return null
          }
        `,
      })('src/pages/account.tsx'),
      code: code`
        import { UserMenu } from '../components/user-menu'

        export default function AccountPage() {
          return <UserMenu />
        }
      `,
    },
    {
      name: 'files in ignored directories are not pages',
      filename: wakuProject()('src/pages/_components/post.tsx'),
      code: code`
        import { PostInfo } from '../../components/post-info'

        export default function Post() {
          return <PostInfo id="1" />
        }
      `,
    },
    {
      name: 'projects that do not depend on Waku are not checked as Waku apps',
      filename: createProject({
        'package.json': JSON.stringify({ dependencies: { react: '19' } }),
        'src/queries.ts': queries,
        'src/components/post-info.tsx': code`
          'use client'
          import { useSuspenseQuery } from '@tanstack/react-query'
          import { postOptions } from '../queries'

          export function PostInfo({ id }) {
            useSuspenseQuery(postOptions(id))
            return null
          }
        `,
      })('src/pages/posts/[id].tsx'),
      code: code`
        import { PostInfo } from '../../components/post-info'

        export default function PostPage({ id }) {
          return <PostInfo id={id} />
        }
      `,
    },
    {
      name: 'a route folder named pages is not the pages directory',
      filename: wakuProject({
        'src/pages/_layout.tsx': code`
          import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
          import { userOptions } from '../queries'

          export default async function RootLayout({ children }) {
            const queryClient = new QueryClient()
            await queryClient.prefetchQuery(userOptions)
            return <HydrationBoundary state={dehydrate(queryClient)}>{children}</HydrationBoundary>
          }
        `,
        'src/components/user-menu.tsx': code`
          'use client'
          import { useSuspenseQuery } from '@tanstack/react-query'
          import { userOptions } from '../queries'

          export function UserMenu() {
            useSuspenseQuery(userOptions)
            return null
          }
        `,
      })('src/pages/docs/pages/intro.tsx'),
      code: code`
        import { UserMenu } from '../../../components/user-menu'

        export default function IntroPage() {
          return <UserMenu />
        }
      `,
    },
  ],
  invalid: [
    {
      name: 'slices are not rendered inside layouts',
      filename: wakuProject({
        'src/pages/_layout.tsx': code`
          import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
          import { userOptions } from '../queries'

          export default async function RootLayout({ children }) {
            const queryClient = new QueryClient()
            await queryClient.prefetchQuery(userOptions)
            return <HydrationBoundary state={dehydrate(queryClient)}>{children}</HydrationBoundary>
          }
        `,
        'src/components/user-menu.tsx': code`
          'use client'
          import { useSuspenseQuery } from '@tanstack/react-query'
          import { userOptions } from '../queries'

          export function UserMenu() {
            useSuspenseQuery(userOptions)
            return null
          }
        `,
      })('src/pages/_slices/user.tsx'),
      code: code`
        import { UserMenu } from '../../components/user-menu'

        export default function UserSlice() {
          return <UserMenu />
        }
      `,
      errors: [
        {
          messageId: 'missingPrefetch',
          line: 4,
          data: {
            hook: 'useSuspenseQuery',
            method: 'query',
            options: 'userOptions',
            location: " in '../../components/user-menu.tsx'",
            site: 'this slice',
          },
        },
      ],
    },
    {
      name: 'page renders a client component whose query it does not prefetch',
      filename: wakuProject()('src/pages/posts/[id].tsx'),
      code: code`
        import { PostInfo } from '../../components/post-info'

        export default function PostPage({ id }) {
          return <PostInfo id={id} />
        }
      `,
      errors: [
        {
          messageId: 'missingPrefetch',
          line: 4,
          data: {
            hook: 'useSuspenseQuery',
            method: 'query',
            options: 'postOptions(id)',
            location: " in '../../components/post-info.tsx'",
            site: 'this page',
          },
        },
      ],
    },
    {
      name: 'prefetched but not rendered inside a HydrationBoundary',
      filename: wakuProject()('src/pages/posts/[id].tsx'),
      code: code`
        import { QueryClient } from '@tanstack/react-query'
        import { postOptions } from '../../queries'
        import { PostInfo } from '../../components/post-info'

        export default async function PostPage({ id }) {
          const queryClient = new QueryClient()
          await queryClient.prefetchQuery(postOptions(id))
          return <PostInfo id={id} />
        }
      `,
      errors: [{ messageId: 'notDehydrated', line: 8 }],
    },
    {
      name: 'a layout renders a client component whose query it does not prefetch',
      filename: wakuProject({
        'src/components/user-menu.tsx': code`
          'use client'
          import { useSuspenseQuery } from '@tanstack/react-query'
          import { userOptions } from '../queries'

          export function UserMenu() {
            useSuspenseQuery(userOptions)
            return null
          }
        `,
      })('src/pages/_layout.tsx'),
      code: code`
        import { UserMenu } from '../components/user-menu'

        export default function RootLayout({ children }) {
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
            location: " in '../components/user-menu.tsx'",
            site: 'this layout',
          },
        },
      ],
    },
  ],
})
