// In an app, the TanStack Router plugin generates this file. It is written by
// hand here so `createFileRoute` is typed without running the generator.

import type { Route as rootRoute } from './__root'
import type { Route as postRoute } from './posts.$postId'
import type { Route as commentsRoute } from './posts.$postId.comments'
import type { Route as authorRoute } from './authors.$authorId'

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/posts/$postId': {
      id: '/posts/$postId'
      path: '/posts/$postId'
      fullPath: '/posts/$postId'
      preLoaderRoute: typeof postRoute
      parentRoute: typeof rootRoute
    }
    '/posts/$postId/comments': {
      id: '/posts/$postId/comments'
      path: '/comments'
      fullPath: '/posts/$postId/comments'
      preLoaderRoute: typeof commentsRoute
      parentRoute: typeof postRoute
    }
    '/authors/$authorId': {
      id: '/authors/$authorId'
      path: '/authors/$authorId'
      fullPath: '/authors/$authorId'
      preLoaderRoute: typeof authorRoute
      parentRoute: typeof rootRoute
    }
  }
}
