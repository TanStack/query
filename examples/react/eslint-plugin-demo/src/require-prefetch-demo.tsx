import { useState } from 'react'
import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { createRootRouteWithContext, createRoute } from '@tanstack/react-router'
import { commentsOptions, postOptions, postsOptions } from './queries'
import type { QueryClient } from '@tanstack/react-query'

const rootRoute = createRootRouteWithContext<{ queryClient: QueryClient }>()()

// ✅ passes: the loader starts the same query the component reads.
// The prefetch doesn't have to be awaited, it only has to be in flight.
export const postRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/posts/$postId',
  loader: ({ params, context }) => {
    void context.queryClient.query(postOptions(params.postId))
  },
  component: function Post() {
    const { postId } = postRoute.useParams()
    const { data } = useSuspenseQuery(postOptions(postId))
    return data.title
  },
})

// ✅ passes: search params reach the loader through loaderDeps
export const postsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/posts',
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search.page ?? 1),
  }),
  loaderDeps: ({ search: { page } }) => ({ page }),
  loader: ({ deps, context }) =>
    context.queryClient.query(postsOptions(deps.page)),
  component: function Posts() {
    const { page } = postsRoute.useSearch()
    const { data } = useSuspenseQuery(postsOptions(page))
    return data.length
  },
})

// ✅ passes: a query that depends on component state can't be prefetched in
// the loader, so it isn't reported
export const draftsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/drafts',
  component: function Drafts() {
    const [page] = useState(1)
    const { data } = useQuery(postsOptions(page))
    return data?.length
  },
})

// ❌ fails: the route has no loader, so the comments only start fetching
// after the component renders
export const commentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/posts/$postId/comments',
  component: function Comments() {
    const { postId } = commentsRoute.useParams()
    // eslint-disable-next-line @tanstack/query-prefetch/require-prefetch -- The query 'commentsOptions(postId)' used by 'useSuspenseQuery' isn't prefetched in this route's loader, so it only starts fetching after the component renders. Start it in this route's loader by passing the same query options to 'queryClient.query()'.
    const { data } = useSuspenseQuery(commentsOptions(postId))
    return data.length
  },
})

// ❌ fails: the loader prefetches the first page, but the component reads the
// page from the search params. Pass `page` through loaderDeps to fix it.
export const archiveRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/archive',
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search.page ?? 1),
  }),
  loader: ({ context }) => context.queryClient.query(postsOptions(1)),
  component: function Archive() {
    const { page } = archiveRoute.useSearch()
    // eslint-disable-next-line @tanstack/query-prefetch/require-prefetch -- The query 'postsOptions(page)' used by 'useSuspenseQuery' isn't prefetched in this route's loader, so it only starts fetching after the component renders. Start it in this route's loader by passing the same query options to 'queryClient.query()'.
    const { data } = useSuspenseQuery(postsOptions(page))
    return data.length
  },
})
