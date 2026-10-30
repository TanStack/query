import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { rule } from '../rules/require-prefetch/require-prefetch.rule'
import { code, createProject } from './project-fixture'
import { normalizeIndent } from './test-utils'

RuleTester.afterAll = afterAll
RuleTester.describe = describe
RuleTester.it = it

const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: {
      ecmaFeatures: { jsx: true },
    },
  },
})

const imports = normalizeIndent`
  import { createFileRoute, createRoute, createRootRouteWithContext, useParams, useSearch, useLoaderDeps } from '@tanstack/react-router'
  import { useQuery, useSuspenseQuery, useInfiniteQuery, queryOptions } from '@tanstack/react-query'
  import { useState } from 'react'
  import { postQueryOptions, postsQueryOptions, commentsInfiniteOptions, postQueries } from './queries'
`

const tanstackSite = "this route's loader"

function withImports(template: TemplateStringsArray) {
  return imports + normalizeIndent(template)
}

ruleTester.run('require-prefetch', rule, {
  valid: [
    {
      name: 'prefetched with queryClient.query from route params',
      code: withImports`
        export const Route = createFileRoute('/posts/$postId')({
          loader: ({ params, context }) =>
            context.queryClient.query(postQueryOptions(params.postId)),
          component: Post,
        })

        function Post() {
          const { postId } = Route.useParams()
          const { data } = useSuspenseQuery(postQueryOptions(postId))
          return null
        }
      `,
    },
    {
      name: 'prefetch does not have to be awaited',
      code: withImports`
        export const Route = createFileRoute('/posts/$postId')({
          loader: ({ params: { postId }, context: { queryClient } }) => {
            void queryClient.query(postQueryOptions(postId))
          },
          component: Post,
        })

        function Post() {
          const params = Route.useParams()
          useSuspenseQuery(postQueryOptions(params.postId))
          return null
        }
      `,
    },
    {
      name: 'prefetches inside Promise.all, with the loader context as a single parameter',
      code: withImports`
        export const Route = createFileRoute('/posts/$postId')({
          async loader(ctx) {
            await Promise.all([
              ctx.context.queryClient.query(postQueryOptions(ctx.params.postId)),
              ctx.context.queryClient.query(postsQueryOptions),
            ])
          },
          component: Post,
        })

        function Post() {
          const { postId } = Route.useParams()
          useSuspenseQuery(postQueryOptions(postId))
          useQuery(postsQueryOptions)
          return null
        }
      `,
    },
    {
      name: 'search params passed through loaderDeps',
      code: withImports`
        export const Route = createFileRoute('/posts')({
          loaderDeps: ({ search: { page } }) => ({ page }),
          loader: ({ deps, context }) =>
            context.queryClient.query(postsQueryOptions(deps.page)),
          component: Posts,
        })

        function Posts() {
          const { page } = Route.useSearch()
          useSuspenseQuery(postsQueryOptions(page))
          return null
        }
      `,
    },
    {
      name: 'search params read with select and with useLoaderDeps',
      code: withImports`
        export const Route = createFileRoute('/posts')({
          loaderDeps: ({ search }) => ({ page: search.page }),
          loader: ({ deps: { page }, context }) =>
            context.queryClient.query(postsQueryOptions(page)),
          component: Posts,
        })

        function Posts() {
          const page = Route.useSearch({ select: (search) => search.page })
          const deps = Route.useLoaderDeps()
          useSuspenseQuery(postsQueryOptions(page))
          useSuspenseQuery(postsQueryOptions(deps.page))
          return null
        }
      `,
    },
    {
      name: 'derived arguments match when derived the same way',
      code: withImports`
        export const Route = createFileRoute('/posts/$postId')({
          loader: ({ params, context }) =>
            context.queryClient.query(postQueryOptions(Number(params.postId))),
          component: Post,
        })

        function Post() {
          const id = Number(Route.useParams().postId)
          useSuspenseQuery(postQueryOptions(id))
          return null
        }
      `,
    },
    {
      name: 'factory on an object, spread into options with select, used twice',
      code: withImports`
        export const Route = createFileRoute('/posts/$postId')({
          loader: ({ params, context }) =>
            context.queryClient.ensureQueryData(postQueries.detail(params.postId)),
          component: Post,
        })

        function Post() {
          const { postId } = Route.useParams()
          useSuspenseQuery({ ...postQueries.detail(postId), select: (post) => post.title })
          useSuspenseQuery(postQueries.detail(postId))
          return null
        }
      `,
    },
    {
      name: 'infinite query prefetched with infiniteQuery',
      code: withImports`
        export const Route = createFileRoute('/posts/$postId')({
          loader: ({ params, context }) =>
            context.queryClient.infiniteQuery(commentsInfiniteOptions(params.postId)),
          component: Post,
        })

        function Post() {
          const { postId } = Route.useParams()
          useInfiniteQuery(commentsInfiniteOptions(postId))
          return null
        }
      `,
    },
    {
      name: 'query depending on component state can not be prefetched and is not reported',
      code: withImports`
        export const Route = createFileRoute('/posts')({
          component: Posts,
        })

        function Posts() {
          const [page] = useState(1)
          useQuery(postsQueryOptions(page))
          return null
        }
      `,
    },
    {
      name: 'query depending on props derived from state in a child component is not reported',
      code: withImports`
        export const Route = createFileRoute('/posts')({
          component: Posts,
        })

        function Posts() {
          const [postId] = useState('1')
          return <Comments postId={postId} />
        }

        function Comments({ postId }) {
          useQuery(postQueryOptions(postId))
          return null
        }
      `,
    },
    {
      name: 'inline options depending on component state are not reported',
      code: withImports`
        export const Route = createFileRoute('/posts')({
          component: Posts,
        })

        function Posts() {
          const [page] = useState(1)
          useQuery({ queryKey: ['posts', page], queryFn: () => fetchPosts(page) })
          return null
        }
      `,
    },
    {
      name: 'components that are not route components are not checked',
      code: withImports`
        export function Post() {
          useSuspenseQuery(postsQueryOptions)
          return null
        }
      `,
    },
    {
      name: 'routes from other libraries are not checked',
      code: normalizeIndent`
        import { createFileRoute } from './my-router'
        import { useSuspenseQuery } from '@tanstack/react-query'
        import { postsQueryOptions } from './queries'

        export const Route = createFileRoute('/posts')({
          component: Posts,
        })

        function Posts() {
          useSuspenseQuery(postsQueryOptions)
          return null
        }
      `,
    },
    {
      name: 'component imported from another file is not checked',
      code: withImports`
        import { Posts } from './posts'

        export const Route = createFileRoute('/posts')({
          component: Posts,
        })
      `,
    },
    {
      name: 'the same value passed twice',
      code: withImports`
        export const Route = createFileRoute('/posts/$postId')({
          loader: ({ params, context }) =>
            context.queryClient.query(postQueryOptions(params.postId, params.postId)),
          component: Post,
        })

        function Post() {
          const { postId } = Route.useParams()
          useSuspenseQuery(postQueryOptions(postId, postId))
          return null
        }
      `,
    },
    {
      name: 'destructuring defaults applied the same way in loaderDeps and the component',
      code: withImports`
        export const Route = createFileRoute('/posts')({
          loaderDeps: ({ search: { page = 1 } }) => ({ page }),
          loader: ({ deps, context }) =>
            context.queryClient.query(postsQueryOptions(deps.page)),
          component: Posts,
        })

        function Posts() {
          const { page = 1 } = Route.useSearch()
          useSuspenseQuery(postsQueryOptions(page))
          return null
        }
      `,
    },
    {
      name: 'root route created with createRootRouteWithContext',
      code: withImports`
        export const Route = createRootRouteWithContext()({
          loader: ({ context }) => context.queryClient.query(postsQueryOptions),
          component: Root,
        })

        function Root() {
          useSuspenseQuery(postsQueryOptions)
          return null
        }
      `,
    },
    {
      name: 'useParams with from set to the route path',
      code: withImports`
        export const Route = createFileRoute('/posts/$postId')({
          loader: ({ params, context }) =>
            context.queryClient.query(postQueryOptions(params.postId)),
          component: Post,
        })

        function Post() {
          const { postId } = useParams({ from: '/posts/$postId' })
          useSuspenseQuery(postQueryOptions(postId))
          return null
        }
      `,
    },
    {
      name: 'useParams with from set to Route.id and select, and useLoaderDeps with Route.fullPath',
      code: withImports`
        export const Route = createFileRoute('/posts/$postId')({
          loaderDeps: ({ search: { page } }) => ({ page }),
          loader: ({ params, deps, context }) =>
            context.queryClient.query(postQueryOptions(params.postId, deps.page)),
          component: Post,
        })

        function Post() {
          const postId = useParams({ from: Route.id, select: (p) => p.postId })
          const { page } = useLoaderDeps({ from: Route.fullPath })
          useSuspenseQuery(postQueryOptions(postId, page))
          return null
        }
      `,
    },
    {
      name: 'params and search params of a parent route are available to the loader',
      code: withImports`
        export const Route = createFileRoute('/posts/$postId/comments')({
          loaderDeps: ({ search: { sort } }) => ({ sort }),
          loader: ({ params, deps, context }) =>
            context.queryClient.query(postQueryOptions(params.postId, deps.sort)),
          component: Comments,
        })

        function Comments() {
          const { postId } = useParams({ from: '/posts/$postId' })
          const { sort } = useSearch({ from: '/posts' })
          useSuspenseQuery(postQueryOptions(postId, sort))
          return null
        }
      `,
    },
    {
      name: 'strict: false values can not be traced to a route and are not reported',
      code: withImports`
        export const Route = createFileRoute('/posts/$postId')({
          component: Post,
        })

        function Post() {
          const { postId } = useParams({ strict: false })
          useSuspenseQuery(postQueryOptions(postId))
          return null
        }
      `,
    },
    {
      name: 'loader deps of a route from another file are not reported',
      code: withImports`
        export const Route = createFileRoute('/posts/$postId')({
          component: Post,
        })

        function Post() {
          const { page } = useLoaderDeps({ from: '/posts' })
          useSuspenseQuery(postsQueryOptions(page))
          return null
        }
      `,
    },
    {
      name: 'hooks with the same names from other libraries are not treated as route values',
      code: normalizeIndent`
        import { createFileRoute } from '@tanstack/react-router'
        import { useSuspenseQuery } from '@tanstack/react-query'
        import { useParams } from 'react-router'
        import { postQueryOptions } from './queries'

        export const Route = createFileRoute('/posts/$postId')({
          component: Post,
        })

        function Post() {
          const { postId } = useParams({ from: '/posts/$postId' })
          useSuspenseQuery(postQueryOptions(postId))
          return null
        }
      `,
    },
  ],
  invalid: [
    {
      name: 'route without a loader',
      code: withImports`
        export const Route = createFileRoute('/posts/$postId')({
          component: Post,
        })

        function Post() {
          const { postId } = Route.useParams()
          useSuspenseQuery(postQueryOptions(postId))
          return null
        }
      `,
      errors: [
        {
          messageId: 'missingPrefetch',
          data: {
            hook: 'useSuspenseQuery',
            method: 'query',
            options: 'postQueryOptions(postId)',
            location: '',
            site: tanstackSite,
          },
        },
      ],
    },
    {
      name: 'loader prefetches with different arguments',
      code: withImports`
        export const Route = createFileRoute('/posts/$postId')({
          loader: ({ params, context }) =>
            context.queryClient.query(postQueryOptions(params.otherId)),
          component: Post,
        })

        function Post() {
          const { postId } = Route.useParams()
          useSuspenseQuery(postQueryOptions(postId))
          return null
        }
      `,
      errors: [{ messageId: 'missingPrefetch' }],
    },
    {
      name: 'loader prefetches a different query',
      code: withImports`
        export const Route = createFileRoute('/posts/$postId')({
          loader: ({ context }) => context.queryClient.query(postsQueryOptions),
          component: Post,
        })

        function Post() {
          useSuspenseQuery(postsQueryOptions)
          useQuery(postQueries.all)
          return null
        }
      `,
      errors: [
        {
          messageId: 'missingPrefetch',
          data: {
            hook: 'useQuery',
            method: 'query',
            options: 'postQueries.all',
            location: '',
            site: tanstackSite,
          },
        },
      ],
    },
    {
      name: 'search params without loaderDeps',
      code: withImports`
        export const Route = createFileRoute('/posts')({
          loader: ({ deps, context }) =>
            context.queryClient.query(postsQueryOptions(deps.page)),
          component: Posts,
        })

        function Posts() {
          const { page } = Route.useSearch()
          useSuspenseQuery(postsQueryOptions(page))
          return null
        }
      `,
      errors: [{ messageId: 'missingPrefetch' }],
    },
    {
      name: 'infinite query',
      code: withImports`
        export const Route = createFileRoute('/posts/$postId')({
          component: Post,
        })

        function Post() {
          const { postId } = Route.useParams()
          useInfiniteQuery(commentsInfiniteOptions(postId))
          return null
        }
      `,
      errors: [
        {
          messageId: 'missingPrefetch',
          data: {
            hook: 'useInfiniteQuery',
            method: 'infiniteQuery',
            options: 'commentsInfiniteOptions(postId)',
            location: '',
            site: tanstackSite,
          },
        },
      ],
    },
    {
      name: 'query in a custom hook and a child component in the same file',
      code: withImports`
        export const Route = createRoute({
          getParentRoute: () => rootRoute,
          path: '/posts/$postId',
          component: () => {
            usePost()
            return <Comments />
          },
        })

        function usePost() {
          const { postId } = Route.useParams()
          return useSuspenseQuery(postQueryOptions(postId))
        }

        const Comments = () => {
          const postId = Route.useParams({ select: (p) => p.postId })
          useInfiniteQuery(commentsInfiniteOptions(postId))
          return null
        }
      `,
      errors: [
        {
          messageId: 'missingPrefetch',
          data: {
            hook: 'useSuspenseQuery',
            method: 'query',
            options: 'postQueryOptions(postId)',
            location: '',
            site: tanstackSite,
          },
        },
        {
          messageId: 'missingPrefetch',
          data: {
            hook: 'useInfiniteQuery',
            method: 'infiniteQuery',
            options: 'commentsInfiniteOptions(postId)',
            location: '',
            site: tanstackSite,
          },
        },
      ],
    },
    {
      name: 'query options from a local variable',
      code: withImports`
        export const Route = createFileRoute('/posts/$postId')({
          component: Post,
        })

        function Post() {
          const { postId } = Route.useParams()
          const options = postQueryOptions(postId)
          useSuspenseQuery(options)
          return null
        }
      `,
      errors: [
        {
          messageId: 'missingPrefetch',
          data: {
            hook: 'useSuspenseQuery',
            method: 'query',
            options: 'options',
            location: '',
            site: tanstackSite,
          },
        },
      ],
    },
    {
      name: 'inline options that could be prefetched',
      code: withImports`
        export const Route = createFileRoute('/posts/$postId')({
          component: Post,
        })

        function Post() {
          const { postId } = Route.useParams()
          useSuspenseQuery({
            queryKey: ['posts', postId],
            queryFn: ({ signal }) => fetchPost(postId, { signal }),
          })
          useQuery(queryOptions({ queryKey: ['posts'], queryFn: fetchPosts }))
          return null
        }
      `,
      errors: [
        { messageId: 'inlineQueryOptions' },
        { messageId: 'inlineQueryOptions' },
      ],
    },
    {
      name: 'a default only applied in the component',
      code: withImports`
        export const Route = createFileRoute('/posts')({
          loaderDeps: ({ search: { page } }) => ({ page }),
          loader: ({ deps, context }) =>
            context.queryClient.query(postsQueryOptions(deps.page)),
          component: Posts,
        })

        function Posts() {
          const { page = 1 } = Route.useSearch()
          useSuspenseQuery(postsQueryOptions(page))
          return null
        }
      `,
      errors: [{ messageId: 'missingPrefetch' }],
    },
    {
      name: 'a component shared by a route that prefetches and one that does not',
      code: withImports`
        export const postRoute = createFileRoute('/posts')({
          loader: ({ context }) => context.queryClient.query(postsQueryOptions),
          component: Posts,
        })

        export const otherRoute = createRoute({
          getParentRoute: () => rootRoute,
          path: '/other',
          component: Posts,
        })

        function Posts() {
          useSuspenseQuery(postsQueryOptions)
          return null
        }
      `,
      errors: [{ messageId: 'missingPrefetch' }],
    },
    {
      name: 'useParams with from, without a loader',
      code: withImports`
        export const Route = createFileRoute('/posts/$postId')({
          component: Post,
        })

        function Post() {
          const { postId } = useParams({ from: '/posts/$postId' })
          useSuspenseQuery(postQueryOptions(postId))
          return null
        }
      `,
      errors: [
        {
          messageId: 'missingPrefetch',
          data: {
            hook: 'useSuspenseQuery',
            method: 'query',
            options: 'postQueryOptions(postId)',
            location: '',
            site: tanstackSite,
          },
        },
      ],
    },
    {
      name: 'search params read with from but not passed through loaderDeps',
      code: withImports`
        export const Route = createFileRoute('/posts')({
          loader: ({ context }) => context.queryClient.query(postsQueryOptions(1)),
          component: Posts,
        })

        function Posts() {
          const page = useSearch({ from: Route.fullPath, select: (s) => s.page })
          useSuspenseQuery(postsQueryOptions(page))
          return null
        }
      `,
      errors: [{ messageId: 'missingPrefetch' }],
    },
  ],
})

const routerProject = (files: Record<string, string>) =>
  createProject({
    'src/queries.ts': code`
      import { queryOptions } from '@tanstack/react-query'

      export const postQueryOptions = (postId: string) =>
        queryOptions({ queryKey: ['post', postId], queryFn: () => fetchPost(postId) })
    `,
    ...files,
  })

const postComponent = code`
  import { getRouteApi } from '@tanstack/react-router'
  import { useSuspenseQuery } from '@tanstack/react-query'
  import { postQueryOptions } from '../queries'

  const routeApi = getRouteApi('/posts/$postId')

  export function Post() {
    const { postId } = routeApi.useParams()
    useSuspenseQuery(postQueryOptions(postId))
    return null
  }
`

ruleTester.run('require-prefetch (TanStack Router, across files)', rule, {
  valid: [
    {
      name: 'component imported from another file reads params with getRouteApi',
      filename: routerProject({ 'src/components/post.tsx': postComponent })(
        'src/routes/posts.$postId.tsx',
      ),
      code: code`
        import { createFileRoute } from '@tanstack/react-router'
        import { postQueryOptions } from '../queries'
        import { Post } from '../components/post'

        export const Route = createFileRoute('/posts/$postId')({
          loader: ({ params, context }) =>
            context.queryClient.query(postQueryOptions(params.postId)),
          component: Post,
        })
      `,
    },
    {
      name: 'prefetch in a helper function the loader calls',
      filename: routerProject({
        'src/components/post.tsx': postComponent,
        'src/prefetch.ts': code`
          import { postQueryOptions } from './queries'

          export const prefetchPost = (queryClient, postId: string) =>
            queryClient.ensureQueryData(postQueryOptions(postId))
        `,
      })('src/routes/posts.$postId.tsx'),
      code: code`
        import { createFileRoute } from '@tanstack/react-router'
        import { prefetchPost } from '../prefetch'
        import { Post } from '../components/post'

        export const Route = createFileRoute('/posts/$postId')({
          loader: async ({ params: { postId }, context }) => {
            await prefetchPost(context.queryClient, postId)
          },
          component: Post,
        })
      `,
    },
    {
      name: 'prefetch in beforeLoad',
      filename: routerProject({ 'src/components/post.tsx': postComponent })(
        'src/routes/posts.$postId.tsx',
      ),
      code: code`
        import { createFileRoute } from '@tanstack/react-router'
        import { postQueryOptions } from '../queries'
        import { Post } from '../components/post'

        export const Route = createFileRoute('/posts/$postId')({
          beforeLoad: ({ params, context }) => {
            void context.queryClient.query(postQueryOptions(params.postId))
          },
          component: Post,
        })
      `,
    },
    {
      name: 'prop passed from the route component to a child in another file',
      filename: routerProject({
        'src/components/post-body.tsx': code`
          import { useSuspenseQuery } from '@tanstack/react-query'
          import { postQueryOptions } from '../queries'

          export const PostBody = ({ postId }: { postId: string }) => {
            useSuspenseQuery(postQueryOptions(postId))
            return null
          }
        `,
      })('src/routes/posts.$postId.tsx'),
      code: code`
        import { createFileRoute } from '@tanstack/react-router'
        import { postQueryOptions } from '../queries'
        import { PostBody } from '../components/post-body'

        export const Route = createFileRoute('/posts/$postId')({
          loader: ({ params, context }) =>
            context.queryClient.query(postQueryOptions(params.postId)),
          component: Post,
        })

        function Post() {
          const { postId } = Route.useParams()
          return <PostBody postId={postId} />
        }
      `,
    },
  ],
  invalid: [
    {
      name: 'component imported from another file, without a loader',
      filename: routerProject({ 'src/components/post.tsx': postComponent })(
        'src/routes/posts.$postId.tsx',
      ),
      code: code`
        import { createFileRoute } from '@tanstack/react-router'
        import { Post } from '../components/post'

        export const Route = createFileRoute('/posts/$postId')({
          component: Post,
        })
      `,
      errors: [
        {
          messageId: 'missingPrefetch',
          line: 5,
          data: {
            hook: 'useSuspenseQuery',
            method: 'query',
            options: 'postQueryOptions(postId)',
            location: " in '../components/post.tsx'",
            site: tanstackSite,
          },
        },
      ],
    },
    {
      name: 'a literal prop passed to a child component',
      code: withImports`
        export const Route = createFileRoute('/posts')({
          component: Posts,
        })

        function Posts() {
          return <Comments postId="1" />
        }

        function Comments({ postId }) {
          useQuery(postQueryOptions(postId))
          return null
        }
      `,
      errors: [{ messageId: 'missingPrefetch', line: 16 }],
    },
  ],
})
